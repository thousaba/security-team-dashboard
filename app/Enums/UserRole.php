<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'soc_manager';
    case Analyst = 'soc_analyst';
    case Responder = 'incident_responder';
    case Hunter = 'threat_hunter';
    case Engineer = 'detection_engineer';
    case Malware = 'malware_analyst';
    case Grc = 'grc_analyst';

    public function department(): ?Department
    {
        return match($this) {
            self::Admin => Department::System,
            self::Manager, self::Analyst, self::Responder => Department::Soc,
            self::Hunter => Department::ThreatIntel,
            self::Engineer => Department::DetectionEngineering,
            self::Malware => Department::MalwareForensics,
            self::Grc => Department::Grc,
        };
    }

    public function label(): string
    {
        return match($this) {
            self::Admin => 'Sistem Yöneticisi',
            self::Manager => 'SOC Yöneticisi',
            self::Analyst => 'SOC Analisti',
            self::Responder => 'Olay Müdahale Uzmanı',
            self::Hunter => 'Tehdit Avcısı',
            self::Engineer => 'Davranış Tespit Mühendisi',
            self::Malware => 'Zararlı Yazılım Analisti',
            self::Grc => 'GRC Analisti',
        };
    }
}
