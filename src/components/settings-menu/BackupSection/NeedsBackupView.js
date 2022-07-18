import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect } from 'react';
import { cloudPlatform } from '../../../utils/platform';
import { RainbowButton } from '../../buttons';
import { SheetActionButton } from '../../sheet';
import { Stack, Text } from '@rainbow-me/design-system';
import BackupIcon from '@rainbow-me/assets/backupIcon.png';
import BackupIconDark from '@rainbow-me/assets/backupIconDark.png';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import { useWallets } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { Box } from '@rainbow-me/design-system';

const BackupButton = styled(RainbowButton).attrs({
  type: 'small',
  width: ios ? 221 : 270,
})({});

const TopIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
})({
  height: 74,
  width: 75,
});

export default function NeedsBackupView() {
  const { navigate, setParams } = useNavigation();
  const { params } = useRoute();
  const { wallets, selectedWallet } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;

  useEffect(() => {
    if (wallets[walletId]?.backedUp) {
      setParams({ type: 'AlreadyBackedUpView' });
    }
  }, [setParams, walletId, wallets]);

  useEffect(() => {
    analytics.track('Needs Backup View', {
      category: 'settings backup',
    });
  }, []);

  const onIcloudBackup = useCallback(() => {
    analytics.track(`Back up to ${cloudPlatform} pressed`, {
      category: 'settings backup',
    });
    navigate(ios ? Routes.BACKUP_SHEET : Routes.BACKUP_SCREEN, {
      nativeScreen: true,
      step: WalletBackupStepTypes.cloud,
      walletId,
    });
  }, [navigate, walletId]);

  const onManualBackup = useCallback(() => {
    analytics.track('Manual Backup pressed', {
      category: 'settings backup',
    });
    navigate(ios ? Routes.BACKUP_SHEET : Routes.BACKUP_SCREEN, {
      nativeScreen: true,
      step: WalletBackupStepTypes.manual,
      walletId,
    });
  }, [navigate, walletId]);

  const { colors, isDarkMode } = useTheme();

  return (
    <Box alignItems="center" width="full" height="full">
      <Box marginTop="-10px">
        <Text
          color={{ custom: colors.orangeLight }}
          size="14px"
          weight="medium"
        >
          {lang.t('back_up.needs_backup.not_backed_up')}
        </Text>
      </Box>
      <Box
        alignItems="center"
        justifyContent="center"
        width="full"
        height="full"
        marginTop="-36px"
      >
        <TopIcon source={isDarkMode ? BackupIconDark : BackupIcon} />
        <Stack space="19px" alignHorizontal="center">
          <Text weight="bold" size="20px">
            {lang.t('back_up.needs_backup.back_up_your_wallet')}{' '}
          </Text>
          <Box paddingHorizontal="42px" paddingBottom="24px">
            <Text color="secondary50" size="18px" align="center">
              {lang.t('back_up.needs_backup.dont_risk')}
            </Text>
          </Box>
          <BackupButton
            label={`􀙶 ${lang.t('modal.back_up.default.button.cloud_platform', {
              cloudPlatformName: cloudPlatform,
            })}`}
            onPress={onIcloudBackup}
          />
          <SheetActionButton
            color={colors.white}
            label={`🤓 ${lang.t('modal.back_up.default.button.manual')}`}
            onPress={onManualBackup}
            textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          />
        </Stack>
      </Box>
    </Box>
  );
}
