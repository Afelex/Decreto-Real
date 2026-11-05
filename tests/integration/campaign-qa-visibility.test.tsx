import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CampaignQaNavigator from '../../screens/CampaignQaNavigator.tsx';

afterEach(cleanup);

test('development QA navigation is accessible on menu and inside campaign', () => {
  const menu = render(<MemoryRouter initialEntries={['/']}><CampaignQaNavigator /></MemoryRouter>);
  expect(screen.getByTestId('campaign-qa-toggle')).toBeTruthy();
  menu.unmount();
  render(<MemoryRouter initialEntries={['/campania/mision/38']}><CampaignQaNavigator /></MemoryRouter>);
  expect(screen.getByTestId('campaign-qa-toggle')).toBeTruthy();
});

test('QA controls never intercept taps on free duel, prototype, tutorial, or options', () => {
  for (const route of ['/game', '/duelo-v1', '/duelo-v1/tutorial', '/rules', '/options', '/victory']) {
    const result = render(<MemoryRouter initialEntries={[route]}><CampaignQaNavigator /></MemoryRouter>);
    expect(result.queryByTestId('campaign-qa-toggle'), route).toBeNull();
    result.unmount();
  }
});
