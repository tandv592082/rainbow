import React, { useMemo } from 'react';
import { Image } from 'react-native';
import { Centered } from '../layout';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { AssetTypes } from '@rainbow-me/entities';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { borders, fonts, fontWithWidth, position } from '@rainbow-me/styles';
import {
  FallbackIcon,
  getUrlForTrustIconFallback,
  isETH,
  magicMemo,
} from '@rainbow-me/utils';

const fallbackTextStyles = {
  ...fontWithWidth(fonts.weight.bold),
  letterSpacing: fonts.letterSpacing.roundedTight,
  textAlign: 'center',
};

const FallbackImage = styled(ImageWithCachedMetadata)(
  ({ size, theme: { colors }, showImage }) => ({
    backgroundColor: android && showImage ? colors.white : 'transparent',
    borderRadius: size / 2,
    height: size,
    overflow: android ? 'hidden' : 'visible',
    width: size,
    ...position.coverAsObject,
  })
);

function WrappedFallbackImage({ showImage, size, eth, type, ...props }) {
  return (
    <Centered
      {...props}
      {...position.coverAsObject}
      {...borders.buildCircleAsObject(size)}
    >
      <FallbackImage
        as={eth ? Image : undefined}
        source={EthIcon}
        {...props}
        showImage={showImage}
        size={size}
        type={type}
      />
    </Centered>
  );
}

const FallbackImageElement = android ? WrappedFallbackImage : FallbackImage;

const CoinIconFallback = fallbackProps => {
  const {
    address = '',
    mainnet_address,
    height,
    symbol,
    width,
    type,
  } = fallbackProps;

  const [showImage, showFallbackImage, hideFallbackImage] = useBooleanState(
    false
  );

  const fallbackIconColor = useColorForAsset({
    address: mainnet_address || address,
    type: mainnet_address ? AssetTypes.token : type,
  });
  const imageUrl = useMemo(
    () =>
      getUrlForTrustIconFallback(
        mainnet_address || address,
        mainnet_address ? AssetTypes.token : type
      ),
    [address, mainnet_address, type]
  );

  const eth = isETH(address);

  return (
    <Centered height={height} width={width}>
      {!showImage && (
        <FallbackIcon
          {...fallbackProps}
          color={fallbackIconColor}
          showImage={showImage}
          symbol={symbol || ''}
          textStyles={fallbackTextStyles}
        />
      )}
      <FallbackImageElement
        {...fallbackProps}
        color={fallbackIconColor}
        eth={eth}
        imageUrl={imageUrl}
        onError={hideFallbackImage}
        onLoad={showFallbackImage}
        showImage={showImage}
        size={width}
      />
    </Centered>
  );
};

export default magicMemo(CoinIconFallback, [
  'address',
  'type',
  'style',
  'symbol',
]);
