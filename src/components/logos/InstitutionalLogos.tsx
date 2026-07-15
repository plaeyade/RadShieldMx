/**
 * Logos institucionales para Splash Screen
 * OIEA/IAEA, NCRP, CNSNS, AAPM
 */

export function IAEALogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* OIEA/IAEA Atom Logo */}
      <circle cx="50" cy="50" r="8" fill="#0067A5" />
      <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#0067A5" strokeWidth="2.5" fill="none" transform="rotate(0 50 50)" />
      <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#0067A5" strokeWidth="2.5" fill="none" transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#0067A5" strokeWidth="2.5" fill="none" transform="rotate(120 50 50)" />
      <circle cx="78" cy="35" r="3" fill="#0067A5" />
      <circle cx="22" cy="65" r="3" fill="#0067A5" />
      <circle cx="50" cy="18" r="3" fill="#0067A5" />
    </svg>
  );
}

export function NCRPLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* NCRP Shield Logo */}
      <path d="M50 5 L90 20 V55 C90 75 50 95 50 95 C50 95 10 75 10 55 V20 L50 5Z" stroke="#1e3a5f" strokeWidth="3" fill="#f0f4f8" />
      <text x="50" y="38" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e3a5f" fontFamily="Arial">NCRP</text>
      <path d="M25 48 L75 48" stroke="#1e3a5f" strokeWidth="1.5" />
      <text x="50" y="62" textAnchor="middle" fontSize="7" fill="#1e3a5f" fontFamily="Arial">National Council on</text>
      <text x="50" y="72" textAnchor="middle" fontSize="7" fill="#1e3a5f" fontFamily="Arial">Radiation Protection</text>
      <circle cx="50" cy="82" r="4" fill="#d4af37" />
    </svg>
  );
}

export function CNSNSLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* CNSNS Mexican Radiation Logo */}
      <rect x="10" y="10" width="80" height="80" rx="8" stroke="#006847" strokeWidth="3" fill="#f8fdf9" />
      {/* Mexican flag colors top */}
      <rect x="10" y="10" width="80" height="12" rx="8" fill="#006847" />
      <rect x="10" y="22" width="80" height="12" fill="#fff" />
      <rect x="10" y="34" width="80" height="12" fill="#ce1126" />
      {/* Radiation symbol */}
      <circle cx="50" cy="62" r="6" fill="#ce1126" />
      <path d="M50 46 A16 16 0 0 1 64 54 L56 58 A8 8 0 0 0 50 54Z" fill="#ce1126" />
      <path d="M50 46 A16 16 0 0 0 36 54 L44 58 A8 8 0 0 1 50 54Z" fill="#ce1126" />
      <path d="M42 70 A16 16 0 0 0 58 70 L50 62Z" fill="#ce1126" />
      <text x="50" y="88" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#006847" fontFamily="Arial">CNSNS</text>
    </svg>
  );
}

export function AAPMLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* AAPM Medical Physics Logo */}
      <circle cx="50" cy="45" r="35" stroke="#003366" strokeWidth="3" fill="#e8f0fe" />
      {/* Medical cross */}
      <rect x="43" y="25" width="14" height="40" rx="3" fill="#003366" />
      <rect x="30" y="38" width="40" height="14" rx="3" fill="#003366" />
      {/* Physics waves */}
      <path d="M20 75 Q30 65 40 75 Q50 85 60 75 Q70 65 80 75" stroke="#0066cc" strokeWidth="2.5" fill="none" />
      <text x="50" y="92" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#003366" fontFamily="Arial">AAPM</text>
    </svg>
  );
}

export function ICRPLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ICRP Logo */}
      <circle cx="50" cy="40" r="30" stroke="#4a148c" strokeWidth="3" fill="#f3e5f5" />
      <text x="50" y="45" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#4a148c" fontFamily="Arial">ICRP</text>
      <path d="M30 70 Q50 55 70 70" stroke="#4a148c" strokeWidth="2" fill="none" />
      <text x="50" y="88" textAnchor="middle" fontSize="7" fill="#4a148c" fontFamily="Arial">International Commission</text>
      <text x="50" y="96" textAnchor="middle" fontSize="7" fill="#4a148c" fontFamily="Arial">on Radiological Protection</text>
    </svg>
  );
}

export function ICRULogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ICRU Logo */}
      <rect x="15" y="15" width="70" height="60" rx="6" stroke="#1565c0" strokeWidth="3" fill="#e3f2fd" />
      <text x="50" y="42" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1565c0" fontFamily="Arial">ICRU</text>
      <path d="M25 52 L75 52" stroke="#1565c0" strokeWidth="1.5" />
      <text x="50" y="65" textAnchor="middle" fontSize="7" fill="#1565c0" fontFamily="Arial">International Commission</text>
      <text x="50" y="88" textAnchor="middle" fontSize="8" fill="#1565c0" fontFamily="Arial">Radiation Units & Measurements</text>
    </svg>
  );
}
