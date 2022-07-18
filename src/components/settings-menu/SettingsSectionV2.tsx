import AsyncStorage from '@react-native-community/async-storage';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Linking, NativeModules, Share } from 'react-native';
import {
  ContextMenuButton,
  MenuActionConfig,
} from 'react-native-ios-context-menu';
import { supportedLanguages } from '../../languages';
import AppVersionStamp from '../AppVersionStamp';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import BackupIcon from '@rainbow-me/assets/settingsBackup.png';
import BackupIconDark from '@rainbow-me/assets/settingsBackupDark.png';
import CurrencyIcon from '@rainbow-me/assets/settingsCurrency.png';
import CurrencyIconDark from '@rainbow-me/assets/settingsCurrencyDark.png';
import DarkModeIcon from '@rainbow-me/assets/settingsDarkMode.png';
import DarkModeIconDark from '@rainbow-me/assets/settingsDarkModeDark.png';
import LanguageIcon from '@rainbow-me/assets/settingsLanguage.png';
import LanguageIconDark from '@rainbow-me/assets/settingsLanguageDark.png';
import NetworkIcon from '@rainbow-me/assets/settingsNetwork.png';
import NetworkIconDark from '@rainbow-me/assets/settingsNetworkDark.png';
import NotificationsIcon from '@rainbow-me/assets/settingsNotifications.png';
import NotificationsIconDark from '@rainbow-me/assets/settingsNotificationsDark.png';
import PrivacyIcon from '@rainbow-me/assets/settingsPrivacy.png';
import PrivacyIconDark from '@rainbow-me/assets/settingsPrivacyDark.png';
import useExperimentalFlag, {
  LANGUAGE_SETTINGS,
} from '@rainbow-me/config/experimentalHooks';
import { Box } from '@rainbow-me/design-system';
import {
  isCustomBuild,
  setOriginalDeploymentKey,
} from '@rainbow-me/handlers/fedora';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useAccountSettings,
  useSendFeedback,
  useWallets,
} from '@rainbow-me/hooks';
import { Themes, useTheme } from '@rainbow-me/theme';
import { showActionSheetWithOptions } from '@rainbow-me/utils';
import {
  AppleReviewAddress,
  REVIEW_DONE_KEY,
} from '@rainbow-me/utils/reviewAlert';

// const { RainbowRequestReview, RNReview } = NativeModules;

const SettingsExternalURLs = {
  rainbowHomepage: 'https://rainbow.me',
  rainbowLearn: 'https://learn.rainbow.me',
  review:
    'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review',
  twitterDeepLink: 'twitter://user?screen_name=rainbowdotme',
  twitterWebUrl: 'https://twitter.com/rainbowdotme',
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const checkAllWallets = (wallets: any) => {
  if (!wallets)
    return { allBackedUp: false, areBackedUp: false, canBeBackedUp: false };
  let areBackedUp = true;
  let canBeBackedUp = false;
  let allBackedUp = true;
  Object.keys(wallets).forEach(key => {
    if (!wallets[key].backedUp && wallets[key].type !== WalletTypes.readOnly) {
      allBackedUp = false;
    }

    if (
      !wallets[key].backedUp &&
      wallets[key].type !== WalletTypes.readOnly &&
      !wallets[key].imported
    ) {
      areBackedUp = false;
    }
    if (wallets[key].type !== WalletTypes.readOnly) {
      canBeBackedUp = true;
    }
  });
  return { allBackedUp, areBackedUp, canBeBackedUp };
};

interface SettingsSectionProps {
  onCloseModal: () => void;
  onPressBackup: () => void;
  onPressCurrency: () => void;
  onPressDev: () => void;
  onPressIcloudBackup: () => void;
  onPressLanguage: () => void;
  onPressNetwork: () => void;
  onPressPrivacy: () => void;
  onPressShowSecret: () => void;
  onPressNotifications: () => void;
}

const SettingsSectionV2 = ({
  onCloseModal,
  onPressBackup,
  onPressCurrency,
  onPressDev,
  onPressIcloudBackup,
  onPressLanguage,
  onPressNetwork,
  onPressPrivacy,
  onPressShowSecret,
  onPressNotifications,
}: SettingsSectionProps) => {
  const isReviewAvailable = false;
  const { wallets, isReadOnlyWallet } = useWallets();
  const {
    language,
    nativeCurrency,
    network,
    testnetsEnabled,
  } = useAccountSettings();
  const isLanguageSelectionEnabled = useExperimentalFlag(LANGUAGE_SETTINGS);

  const { isDarkMode, setTheme, colorScheme } = useTheme();

  const onSendFeedback = useSendFeedback();

  const onPressReview = null;
  // const onPressReview = useCallback(async () => {
  //   if (ios) {
  //     onCloseModal();
  //     RainbowRequestReview.requestReview((handled: boolean) => {
  //       if (!handled) {
  //         AsyncStorage.setItem(REVIEW_DONE_KEY, 'true');
  //         Linking.openURL(AppleReviewAddress);
  //       }
  //     });
  //   } else {
  //     RNReview.show();
  //   }
  // }, [onCloseModal]);

  const onPressShare = useCallback(() => {
    Share.share({
      message: `${lang.t('settings.hey_friend_message')} ${
        SettingsExternalURLs.rainbowHomepage
      }`,
    });
  }, []);

  const onPressTwitter = useCallback(async () => {
    Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
      supported
        ? Linking.openURL(SettingsExternalURLs.twitterDeepLink)
        : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
    );
  }, []);

  const onPressLearn = useCallback(
    () => Linking.openURL(SettingsExternalURLs.rainbowLearn),
    []
  );

  const { allBackedUp, areBackedUp, canBeBackedUp } = useMemo(
    () => checkAllWallets(wallets),
    [wallets]
  );

  const themeMenuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          actionKey: Themes.SYSTEM,
          actionTitle: lang.t('settings.theme_section.system'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'gear',
          },
          menuState: colorScheme === Themes.SYSTEM ? 'on' : 'off',
        },
        {
          actionKey: Themes.LIGHT,
          actionTitle: lang.t('settings.theme_section.light'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'sun.max',
          },
          menuState: colorScheme === Themes.LIGHT ? 'on' : 'off',
        },
        {
          actionKey: Themes.DARK,
          actionTitle: lang.t('settings.theme_section.dark'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'moon',
          },
          menuState: colorScheme === Themes.DARK ? 'on' : 'off',
        },
      ] as MenuActionConfig[],
      menuTitle: '',
    };
  }, [colorScheme]);

  const onPressThemeAndroidActions = useCallback(() => {
    const androidActions = [
      lang.t('settings.theme_section.system'),
      lang.t('settings.theme_section.light'),
      lang.t('settings.theme_section.dark'),
    ] as const;

    showActionSheetWithOptions(
      {
        options: androidActions,
        showSeparators: true,
        title: '',
      },
      (idx: number) => {
        if (idx === 0) {
          setTheme(Themes.SYSTEM);
        } else if (idx === 1) {
          setTheme(Themes.LIGHT);
        } else if (idx === 2) {
          setTheme(Themes.DARK);
        }
      }
    );
  }, [setTheme]);

  const handleSelectTheme = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      setTheme(actionKey);
    },
    [setTheme]
  );

  return (
    <MenuContainer>
      <Menu>
        {canBeBackedUp && (
          <MenuItem
            hasRightArrow
            iconPadding="medium"
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? BackupIconDark : BackupIcon}
              />
            }
            onPress={onPressBackup}
            rightComponent={
              <MenuItem.StatusIcon
                status={
                  allBackedUp
                    ? 'complete'
                    : areBackedUp
                    ? 'incomplete'
                    : 'warning'
                }
              />
            }
            size="large"
            titleComponent={<MenuItem.Title text={lang.t('settings.backup')} />}
          />
        )}
        <MenuItem
          hasRightArrow
          iconPadding="medium"
          leftComponent={
            <MenuItem.ImageIcon
              source={isDarkMode ? NotificationsIconDark : NotificationsIcon}
            />
          }
          onPress={onPressNotifications}
          size="large"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.notifications')} />
          }
        />
        <MenuItem
          hasRightArrow
          iconPadding="medium"
          leftComponent={
            <MenuItem.ImageIcon
              source={isDarkMode ? CurrencyIconDark : CurrencyIcon}
            />
          }
          onPress={onPressCurrency}
          rightComponent={
            <MenuItem.Selection>{nativeCurrency || ''}</MenuItem.Selection>
          }
          size="large"
          titleComponent={<MenuItem.Title text={lang.t('settings.currency')} />}
        />
        {(testnetsEnabled || IS_DEV) && (
          <MenuItem
            hasRightArrow
            iconPadding="medium"
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? NetworkIconDark : NetworkIcon}
              />
            }
            onPress={onPressNetwork}
            rightComponent={
              <MenuItem.Selection>
                {networkInfo?.[network]?.name}
              </MenuItem.Selection>
            }
            size="large"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.network')} />
            }
          />
        )}
        <ContextMenuButton
          menuConfig={themeMenuConfig}
          {...(android ? { onPress: onPressThemeAndroidActions } : {})}
          isMenuPrimaryAction
          onPressMenuItem={handleSelectTheme}
          useActionSheetFallback={false}
        >
          <MenuItem
            hasChevron
            iconPadding="medium"
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? DarkModeIconDark : DarkModeIcon}
              />
            }
            rightComponent={
              <MenuItem.Selection>
                {colorScheme ? capitalizeFirstLetter(colorScheme) : ''}
              </MenuItem.Selection>
            }
            size="large"
            titleComponent={<MenuItem.Title text={lang.t('settings.theme')} />}
          />
        </ContextMenuButton>
        {!isReadOnlyWallet && (
          <MenuItem
            hasRightArrow
            iconPadding="medium"
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? PrivacyIconDark : PrivacyIcon}
              />
            }
            onPress={onPressPrivacy}
            size="large"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.privacy')} />
            }
          />
        )}
        {isLanguageSelectionEnabled && (
          <MenuItem
            hasRightArrow
            iconPadding="medium"
            leftComponent={
              <MenuItem.ImageIcon
                source={isDarkMode ? LanguageIconDark : LanguageIcon}
              />
            }
            onPress={onPressLanguage}
            rightComponent={
              <MenuItem.Selection>
                {(supportedLanguages as any)[language] || ''}
              </MenuItem.Selection>
            }
            size="large"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.language')} />
            }
          />
        )}
      </Menu>
      <Menu>
        <MenuItem
          iconPadding="large"
          leftComponent={<MenuItem.Title text="🌈" />}
          onPress={onPressShare}
          size="medium"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.share_rainbow')} />
          }
        />
        <MenuItem
          iconPadding="large"
          leftComponent={<MenuItem.Title text="🧠" />}
          onPress={onPressLearn}
          size="medium"
          titleComponent={<MenuItem.Title text={lang.t('settings.learn')} />}
        />
        <MenuItem
          iconPadding="large"
          leftComponent={<MenuItem.Title text="🐦" />}
          onPress={onPressTwitter}
          size="medium"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.follow_us_on_twitter')} />
          }
        />
        <MenuItem
          iconPadding="large"
          leftComponent={<MenuItem.Title text="💬" />}
          onPress={onSendFeedback}
          size="medium"
          titleComponent={
            <MenuItem.Title
              text={lang.t(
                ios
                  ? 'settings.feedback_and_support'
                  : 'settings.feedback_and_reports'
              )}
            />
          }
        />
        {isReviewAvailable && onPressReview && (
          <MenuItem
            iconPadding="large"
            leftComponent={<MenuItem.Title text="❤️" />}
            onPress={onPressReview}
            size="medium"
            titleComponent={<MenuItem.Title text={lang.t('settings.review')} />}
          />
        )}
        {isCustomBuild.value && (
          <MenuItem
            iconPadding="large"
            leftComponent={<MenuItem.Title text="🤯" />}
            onPress={setOriginalDeploymentKey}
            size="medium"
            titleComponent={
              <MenuItem.Title text={lang.t('settings.restore')} />
            }
          />
        )}
        <MenuItem
          iconPadding="large"
          leftComponent={<MenuItem.Title text={ios ? '🚧' : '🐞'} />}
          onPress={onPressDev}
          size="medium"
          titleComponent={
            <MenuItem.Title text={lang.t('settings.developer')} />
          }
        />
      </Menu>
      <Box alignItems="center" width="full">
        <AppVersionStamp />
      </Box>
    </MenuContainer>
  );
};

export default SettingsSectionV2;
