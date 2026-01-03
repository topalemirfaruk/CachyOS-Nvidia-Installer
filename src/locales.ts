export const translations = {
    tr: {
        title: "CachyOS Nvidia Kurucu",
        searching: "Aranıyor...",
        apiMissing: "API Bulunamadı",
        useRepo: "Nvidia Deposunu Kullan",
        installed: "Kurulu",
        loading: "Yükleniyor...",
        unknown: "Bilinmiyor",
        packageNotFound: "Paket Bulunamadı",
        disableSecondary: "İkincil Ekran Kartını Devre Dışı Bırak",
        remove: "Kaldır",
        processing: "İşleniyor...",
        installApply: "Yükle / Uygula",
        confirmRemove: "Şu an yüklü olan sürücüyü ({driver}) kaldırmak istediğinize emin misiniz?",
        successRemove: "Sürücü başarıyla kaldırıldı!\nLütfen sistemi yeniden başlatın.",
        failRemove: "Kaldırma işlemi başarısız!\nLütfen konsolu kontrol edin.",
        successInstall: "İşlem Başarılı!\nLütfen sistemi yeniden başlatın.",
        failInstall: "Hata oluştu!\nLütfen konsolu kontrol edin.",
        drivers: {
            "nvidia-open-dkms": "Açık Kaynaklı Modüller (DKMS) - Önerilen",
            "nvidia-dkms": "Sahipli Sürücü (DKMS) - Mevcutsa",
            "nvidia-550xx-dkms": "Eski Sürücü (550 Series)"
        },
        cardLabels: {
            driver: "Sürücü:",
            version: "Sürüm:",
            description: "Açıklama:",
            repo: "Repo:"
        }
    },
    en: {
        title: "CachyOS Nvidia Installer",
        searching: "Searching...",
        apiMissing: "API Not Found",
        useRepo: "Use Nvidia Repository",
        installed: "Installed",
        loading: "Loading...",
        unknown: "Unknown",
        packageNotFound: "Package Not Found",
        disableSecondary: "Disable Secondary GPU",
        remove: "Remove",
        processing: "Processing...",
        installApply: "Install / Apply",
        confirmRemove: "Are you sure you want to remove the currently installed driver ({driver})?",
        successRemove: "Driver removed successfully!\nPlease reboot your system.",
        failRemove: "Removal failed!\nPlease check the console.",
        successInstall: "Operation Successful!\nPlease reboot your system.",
        failInstall: "An error occurred!\nPlease check the console.",
        drivers: {
            "nvidia-open-dkms": "Open Source Modules (DKMS) - Recommended",
            "nvidia-dkms": "Proprietary Driver (DKMS) - If Available",
            "nvidia-550xx-dkms": "Legacy Driver (550 Series)"
        },
        cardLabels: {
            driver: "Driver:",
            version: "Version:",
            description: "Description:",
            repo: "Repo:"
        }
    }
};

export type Language = 'tr' | 'en';
