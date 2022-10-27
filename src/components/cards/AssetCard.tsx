import lang from 'i18n-js';
import {
  Box,
  Inline,
  Stack,
  Text,
  AccentColorProvider,
  Bleed,
} from '@/design-system';
import { useTheme } from '@/theme';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GenericCard } from './GenericCard';
import { ButtonPressAnimation } from '../animations';
import {
  useAccountSettings,
  useChartThrottledPoints,
  useColorForAsset,
  useGenericAsset,
  useWallets,
} from '@/hooks';
import { deviceUtils, ethereumUtils } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import {
  ChartPath,
  ChartPathProvider,
} from '@/react-native-animated-charts/src';
import { CoinIcon } from '../coin-icon';
import { AssetType } from '@/entities';
import Labels from '../value-chart/ExtremeLabels';
import showWalletErrorAlert from '@/helpers/support';
import { IS_IOS } from '@/env';
import { emitChartsRequest } from '@/redux/explorer';
import chartTypes from '@/helpers/chartTypes';
import Spinner from '../Spinner';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';

export const AssetCardHeight = 284.3;

export const AssetCard = () => {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { colors, isDarkMode } = useTheme();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();
  const genericAsset = useGenericAsset(ETH_ADDRESS);
  const { loaded: accentColorLoaded } = useAccountAccentColor();

  emitChartsRequest([ETH_ADDRESS], chartTypes.day, nativeCurrency);

  const handlePressBuy = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (IS_IOS) {
      navigate(Routes.ADD_CASH_FLOW);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      });
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
      source: 'BuyCard',
    });
  }, [accountAddress, isDamaged, navigate]);

  const assetWithPrice = useMemo(() => {
    return {
      ...ethereumUtils.formatGenericAsset(genericAsset, nativeCurrency),
      address: ETH_ADDRESS,
      symbol: ETH_SYMBOL,
    };
  }, [genericAsset, nativeCurrency]);

  const handleAssetPress = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: assetWithPrice,
      longFormHeight: initialChartExpandedStateSheetHeight,
      type: 'token',
    });
    analytics.track('Asset card opened');
  }, [assetWithPrice, navigate]);

  let colorForAsset = useColorForAsset(
    {
      address: assetWithPrice.address,
      mainnet_address: assetWithPrice?.mainnet_address,
      type: assetWithPrice?.mainnet_address
        ? AssetType.token
        : assetWithPrice.type,
    },
    assetWithPrice?.address ? undefined : colors.appleBlue
  );

  if (isDarkMode && assetWithPrice?.address === ETH_ADDRESS) {
    colorForAsset = colors.whiteLabel;
  }

  const { throttledData } = useChartThrottledPoints({
    asset: assetWithPrice,
  });

  const CHART_WIDTH = deviceUtils.dimensions.width - 80;
  const CHART_HEIGHT = 80;

  let isNegativePriceChange = false;
  if (assetWithPrice.native.change[0] === '-') {
    isNegativePriceChange = true;
  }
  const priceChangeDisplay = isNegativePriceChange
    ? assetWithPrice.native.change.substring(1)
    : assetWithPrice.native.change;

  const priceChangeColor = isNegativePriceChange ? colors.red : colors.green;

  const loadedPrice = accentColorLoaded && assetWithPrice.native.change;
  const loadedChart = throttledData?.points.length && loadedPrice;

  const [noChartData, setNoChartData] = useState(false);

  // If we cant load chart data we should tell the user
  useEffect(() => {
    setTimeout(() => {
      if (!loadedChart) {
        setNoChartData(true);
      } else {
        setNoChartData(false);
      }
    }, 20000);
  }, [loadedChart]);

  return (
    <GenericCard
      disabled={!loadedChart}
      onPress={IS_IOS ? handleAssetPress : handlePressBuy}
      type="stretch"
    >
      <Stack space={{ custom: 41 }}>
        <Stack space="12px">
          <Bleed top="4px">
            <Inline alignVertical="center" alignHorizontal="justify">
              {!loadedPrice ? (
                <Inline space="6px">
                  <Box height={{ custom: 20 }} width={{ custom: 20 }}>
                    <Skeleton>
                      <FakeText height={20} width={20} />
                    </Skeleton>
                  </Box>
                  <Box height={{ custom: 17 }} width={{ custom: 100 }}>
                    <Skeleton>
                      <FakeText height={17} width={100} />
                    </Skeleton>
                  </Box>
                </Inline>
              ) : (
                <Inline alignVertical="center" space="6px">
                  {/* @ts-expect-error – JS component */}
                  <CoinIcon
                    address={assetWithPrice.address}
                    size={20}
                    symbol={assetWithPrice.symbol}
                  />

                  <Text
                    size="17pt"
                    color={{ custom: colorForAsset }}
                    weight="heavy"
                  >
                    {assetWithPrice.name}
                  </Text>
                </Inline>
              )}
              {!loadedPrice ? (
                <Box height={{ custom: 17 }} width={{ custom: 110 }}>
                  <Skeleton>
                    <FakeText height={17} width={110} />
                  </Skeleton>
                </Box>
              ) : (
                <Inline alignVertical="bottom">
                  <Text
                    size="17pt"
                    color={{ custom: priceChangeColor }}
                    weight="bold"
                  >
                    {`${
                      isNegativePriceChange ? '􀄩' : '􀄨'
                    }${priceChangeDisplay}`}
                  </Text>
                  <Text
                    size="13pt"
                    color={{ custom: priceChangeColor }}
                    weight="bold"
                  >
                    {` ${lang.t('expanded_state.chart.today').toLowerCase()}`}
                  </Text>
                </Inline>
              )}
            </Inline>
          </Bleed>
          {!loadedPrice ? (
            <Box height={{ custom: 18 }} justifyContent="center">
              <Skeleton>
                <FakeText height={26} width={130} />
              </Skeleton>
            </Box>
          ) : (
            <Text size="26pt" color={{ custom: colorForAsset }} weight="heavy">
              {assetWithPrice.native.price.display}
            </Text>
          )}
        </Stack>
        <Box height={{ custom: CHART_HEIGHT }} width={{ custom: CHART_WIDTH }}>
          {!loadedChart ? (
            <Box
              height="full"
              width="full"
              alignItems="center"
              justifyContent="center"
            >
              {noChartData ? (
                <Text color="label" size="20pt" weight="semibold">
                  {!loadedPrice ? 'No Price Data' : 'No Chart Data'}
                </Text>
              ) : (
                <Spinner color={colorForAsset} size={30} />
              )}
            </Box>
          ) : (
            <ChartPathProvider
              data={throttledData}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
            >
              <ChartPath
                fill="none"
                gestureEnabled={false}
                height={CHART_HEIGHT}
                hitSlop={0}
                longPressGestureHandlerProps={undefined}
                selectedStrokeWidth={3}
                stroke={colorForAsset}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - prop is accepted via prop spreading
                strokeLinecap="round"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - prop is accepted via prop spreading
                strokeLinejoin="round"
                strokeWidth={4}
                width={CHART_WIDTH}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - prop is accepted via prop spreading
                chartXOffset={0}
                isCard
              />
              <Labels color={colorForAsset} width={CHART_WIDTH} isCard />
            </ChartPathProvider>
          )}
        </Box>
        {!loadedPrice ? (
          <Box height={{ custom: 36 }}>
            <Skeleton>
              <FakeText width={CHART_WIDTH} height={36} />
            </Skeleton>
          </Box>
        ) : (
          <ButtonPressAnimation onPress={handlePressBuy}>
            <AccentColorProvider color={colors.alpha(colorForAsset, 0.1)}>
              <Box
                width="full"
                height={{ custom: 36 }}
                borderRadius={99}
                alignItems="center"
                justifyContent="center"
                background="accent"
              >
                <Text
                  color={{ custom: colorForAsset }}
                  containsEmoji
                  size="15pt"
                  weight="bold"
                >
                  􀍯 Buy Ethereum
                </Text>
              </Box>
            </AccentColorProvider>
          </ButtonPressAnimation>
        )}
      </Stack>
    </GenericCard>
  );
};
