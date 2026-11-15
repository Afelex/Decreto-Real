import { expect, test } from '@playwright/test';

test('las barras de vida de jugador y rival ocupan el HP completo y muestran texto centrado', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');
  const meters = [
    page.getByRole('progressbar', { name: 'Tu vida: 20 de 20' }),
    page.getByRole('progressbar', { name: 'Vida del rival: 20 de 20' }),
  ];
  for (const meter of meters) {
    await expect(meter).toBeVisible();
    await expect(meter).toHaveAttribute('data-hp-state', 'healthy');
    await expect(meter).toHaveAttribute('aria-valuenow', '20');
    const fill = meter.locator('.dr-royal-hp__fill');
    await expect(fill).toHaveCSS('background-color', 'rgb(39, 150, 89)');
    await expect(fill).toHaveAttribute('style', /100%/);
    const geometry = await meter.evaluate(el => {
      const plate = el.getBoundingClientRect();
      const text = el.querySelector('.dr-royal-hp__label')!.getBoundingClientRect();
      const fill = el.querySelector('.dr-royal-hp__fill')!.getBoundingClientRect();
      return {
        textCentered: Math.abs((text.left + text.right) / 2 - (plate.left + plate.right) / 2) < 2,
        fillCoversPlate: Math.abs(fill.width - plate.width) < 4,
      };
    });
    expect(geometry).toEqual({ textCentered: true, fillCoversPlate: true });
  }
});
