'use client';

import React from 'react';
import { GlobalContributionBalance, GlobalContributionBalanceProps } from './GlobalContributionBalance';

export interface BalanceHeroProps extends Partial<GlobalContributionBalanceProps> {
  summary?: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BalanceHero: React.FC<BalanceHeroProps> = (props) => {
  return (
    <GlobalContributionBalance
      variant="hero"
      label="Kantite Kòb ki Ranmase"
      onRefresh={props.onRefresh}
      className={props.className}
    />
  );
};
