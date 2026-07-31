import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
  });
});

const fullscreenSurfaces = [
  ['e2e-open-evidence-pack', 'f392-evidence-pack-fullscreen-shell'],
  ['e2e-open-manual', 'f393-manual-fullscreen-shell'],
  ['e2e-open-memoria-wizard', 'f394-memoria-analitica-fullscreen-shell'],
  ['e2e-open-layout-bunker', 'f395-layout-bunker-fullscreen-shell'],
  ['e2e-open-dashboard', 'f396-dashboard-fullscreen-shell'],
  ['e2e-open-checklist-cnsns', 'f397-checklist-cnsns-fullscreen-shell'],
  ['e2e-open-ncrp151-tables', 'f398-ncrp151-tables-fullscreen-shell'],
];

const dialogShellSurfaces = [
  ['e2e-open-compare-scenarios', 'f389-compare-scenarios-dialogshell'],
  ['e2e-open-tutorial', 'f390-tutorial-dialogshell'],
  ['e2e-open-version-history', 'f391-version-history-dialogshell'],
];

test('fullscreen controlled surfaces expose minimize/contained/close controls', async ({ page }) => {
  await bootWorkspace(page);
  await expect(page.getByTestId('e2e-dialog-controls')).toBeVisible();

  for (const [openButton, shellId] of fullscreenSurfaces) {
    await page.getByTestId(openButton).click();
    const shell = page.getByTestId(shellId);
    await expect(shell).toBeVisible({ timeout: 10000 });

    await page.getByTestId(`${shellId}-minimize`).click();
    await expect(shell).toHaveAttribute('data-fullscreen-shell-collapsed', 'true');

    await page.getByTestId(`${shellId}-minimize`).click();
    await expect(shell).toHaveAttribute('data-fullscreen-shell-collapsed', 'false');

    await page.getByTestId(`${shellId}-contained-toggle`).click();
    await expect(shell).toHaveAttribute('data-fullscreen-shell-contained', 'true');

    await page.getByTestId(`${shellId}-close`).click();
    await expect(shell).toBeHidden({ timeout: 10000 });
  }
});

test('DialogShell migrated surfaces can open and close through shared controls', async ({ page }) => {
  await bootWorkspace(page);
  await expect(page.getByTestId('e2e-dialog-controls')).toBeVisible();

  for (const [openButton, bodyId] of dialogShellSurfaces) {
    await page.getByTestId(openButton).click();
    await expect(page.getByTestId(bodyId)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('draggable-dialog-shell')).toBeVisible();
    await page.getByTestId('f376-dialog-close').click();
    await expect(page.getByTestId(bodyId)).toBeHidden({ timeout: 10000 });
  }
});
