#!/usr/bin/env python3
"""
RadShield-MX: CSV to ROOT converter (Batch 8 — dual-output pipeline)
Converts GEANT4 CSV output to ROOT TTree for offline analysis.
Usage: python csv_to_root.py input.csv.gz output.root
"""
import sys
import os
import gzip
import json
import argparse
from datetime import datetime

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    print("WARNING: numpy not installed. Falling back to manual parsing.")

try:
    import ROOT
    HAS_ROOT = True
except ImportError:
    HAS_ROOT = False
    print("ERROR: ROOT not installed. Install with: conda install -c conda-forge root")
    sys.exit(1)


def read_csv(csv_path: str) -> tuple[list[str], list[list[float | int]]]:
    """Read CSV (plain or gzip) and return (headers, rows)."""
    opener = gzip.open if csv_path.endswith('.gz') else open
    rows: list[list[float | int]] = []
    headers: list[str] = []
    with opener(csv_path, 'rt') as f:
        headers = f.readline().strip().split(',')
        for line in f:
            parts = line.strip().split(',')
            row: list[float | int] = []
            for p in parts:
                try:
                    if '.' in p or 'e' in p.lower():
                        row.append(float(p))
                    else:
                        row.append(int(p))
                except ValueError:
                    row.append(0)
            rows.append(row)
    return headers, rows


def csv_to_root(csv_path: str, root_path: str, tree_name: str = "Shielding", title: str = "RadShield-MX MC Results") -> dict:
    """Convert GEANT4 CSV output to ROOT TTree."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    headers, rows = read_csv(csv_path)
    n_events = len(rows)

    if n_events == 0:
        raise ValueError("CSV file is empty (no data rows)")

    # Create ROOT file and tree
    f = ROOT.TFile(root_path, "RECREATE")
    tree = ROOT.TTree(tree_name, title)

    # Create branches dynamically based on headers
    branch_vars: dict[str, any] = {}
    for i, h in enumerate(headers):
        # Sanitize branch name: replace spaces/special chars
        branch_name = h.strip().replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_').replace('-', '_')
        # Determine type from first row
        val = rows[0][i] if i < len(rows[0]) else 0
        if isinstance(val, int):
            branch_vars[branch_name] = ROOT.array('i', [0])
            tree.Branch(branch_name, branch_vars[branch_name], f"{branch_name}/I")
        else:
            branch_vars[branch_name] = ROOT.array('d', [0.0])
            tree.Branch(branch_name, branch_vars[branch_name], f"{branch_name}/D")

    # Fill tree
    for row in rows:
        for i, h in enumerate(headers):
            branch_name = h.strip().replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_').replace('-', '_')
            val = row[i] if i < len(row) else 0
            if isinstance(branch_vars[branch_name], ROOT.array):
                # ROOT.array type inference
                if isinstance(val, int):
                    branch_vars[branch_name][0] = val
                else:
                    branch_vars[branch_name][0] = float(val)
        tree.Fill()

    # Create summary histograms
    if HAS_NUMPY:
        data = np.array(rows)
        # Histogram 1D: Energy deposit
        if 'Edep_MeV' in headers or 'Edep' in headers:
            edep_col = headers.index('Edep_MeV') if 'Edep_MeV' in headers else headers.index('Edep')
            edep_vals = data[:, edep_col]
            h_edep = ROOT.TH1D("hEdep", "Energy Deposit;Edep (MeV);Counts", 200, float(np.min(edep_vals)), float(np.max(edep_vals)) * 1.1)
            for v in edep_vals:
                h_edep.Fill(float(v))
            h_edep.Write()

        # Histogram 2D: Dose map XY
        if 'X_mm' in headers and 'Y_mm' in headers:
            x_col, y_col = headers.index('X_mm'), headers.index('Y_mm')
            h2 = ROOT.TH2D("hDoseXY", "Dose Map X-Y;X (mm);Y (mm);Dose", 100, float(np.min(data[:, x_col])), float(np.max(data[:, x_col])), 100, float(np.min(data[:, y_col])), float(np.max(data[:, y_col])))
            for row in rows:
                h2.Fill(float(row[x_col]), float(row[y_col]))
            h2.Write()

    # Metadata JSON stored as TObjString
    metadata = {
        "source": "RadShield-MX",
        "version": "12.1",
        "created_at": datetime.now().isoformat(),
        "csv_source": os.path.basename(csv_path),
        "events": n_events,
        "branches": list(branch_vars.keys()),
        "headers_original": headers,
    }
    meta_str = ROOT.TObjString(json.dumps(metadata, indent=2))
    meta_str.Write("metadata")

    tree.Write()
    f.Close()

    # Verify
    file_size_mb = os.path.getsize(root_path) / 1024 / 1024

    return {
        "root_file": root_path,
        "csv_file": csv_path,
        "events": n_events,
        "branches": list(branch_vars.keys()),
        "file_size_mb": round(file_size_mb, 2),
        "tree_name": tree_name,
    }


def main():
    parser = argparse.ArgumentParser(description="Convert RadShield-MX GEANT4 CSV to ROOT TTree")
    parser.add_argument("csv", help="Input CSV file (plain or .gz)")
    parser.add_argument("root", nargs="?", help="Output ROOT file (default: same name with .root)")
    parser.add_argument("--tree-name", default="Shielding", help="TTree name")
    parser.add_argument("--title", default="RadShield-MX MC Results", help="TTree title")
    parser.add_argument("--json-summary", action="store_true", help="Print JSON summary to stdout")
    args = parser.parse_args()

    root_path = args.root or args.csv.replace('.csv', '').replace('.gz', '') + '.root'

    result = csv_to_root(args.csv, root_path, args.tree_name, args.title)

    if args.json_summary:
        print(json.dumps(result, indent=2))
    else:
        print(f"Converted: {result['csv_file']} -> {result['root_file']}")
        print(f"Events: {result['events']:,} | Branches: {', '.join(result['branches'])}")
        print(f"Size: {result['file_size_mb']:.1f} MB")
        print(f"\nQuick analysis:")
        print(f"  root -l {root_path}")
        print(f"  {args.tree_name}->Draw(\"Edep_MeV\")")
        print(f"  {args.tree_name}->Draw(\"Y_mm:X_mm\", \"\", \"colz\")")


if __name__ == "__main__":
    main()
