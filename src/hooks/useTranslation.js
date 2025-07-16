import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation as useTranslationUtil } from '@/utils/translations';

export const useTranslation = () => {
    const { language } = useLanguage();
    const { t } = useTranslationUtil(language);

    return { t };
};
