<?php

declare(strict_types=1);

namespace App\Enums;

enum Department: string
{
    case System = 'system_manager';
    case Soc = 'soc';
    case ThreatIntel = 'threat_intelligence';
    case DetectionEngineering = 'detection_engineering';
    case MalwareForensics = 'malware_analysis';
    case Grc = 'grc';

    public function label(): string
    {
        return match($this) {
            self::System => 'Sistem Yöneticisi',
            self::Soc => 'Güvenlik Operasyon Merkezi (SOC)',
            self::ThreatIntel => 'Tehdit İstihbaratı ve Avcılığı',
            self::DetectionEngineering => 'Tespit Mühendisliği',
            self::MalwareForensics => 'Zararlı Yazılım ve Adli Bilişim',
            self::Grc => 'Yönetişim, Risk ve Uyum (GRC)',
        };
    }
}
