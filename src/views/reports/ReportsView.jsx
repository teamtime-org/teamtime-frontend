import { useTranslation } from '@/hooks/useTranslation';
import { BarChart3 } from 'lucide-react';

const ReportsView = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <BarChart3 className="h-16 w-16 text-gray-400" />
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">{t('reports')}</h2>
                <p className="text-gray-600">{t('comingSoon')}</p>
            </div>
        </div>
    );
};

export default ReportsView;
