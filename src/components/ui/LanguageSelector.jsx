import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const LanguageSelector = () => {
    const { language, changeLanguage } = useLanguage();

    const languages = [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
    ];

    return (
        <div className="relative group">
            <button className="flex items-center space-x-2 text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:block">
                    {languages.find(lang => lang.code === language)?.flag}
                </span>
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${language === lang.code ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            }`}
                    >
                        <span className="mr-3">{lang.flag}</span>
                        {lang.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSelector;
