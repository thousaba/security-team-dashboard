<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Analyst = 'soc_analyst';
    case Engineer = 'detection_engineer';
    case Malware = 'malware_analyst';
    case User = 'standard_user';
    case Developer = 'software_developer';

    public function department(): ?Department
    {
        return match($this) {
            self::Admin => null,
            self::Analyst, self::Engineer => Department::SocThreatHunting,
            self::Malware => Department::Malware,
            self::User => Department::HumanResources,
            self::Developer => Department::Developer,
        };
    }

    public function label(): string
    {
        return match($this) {
            self::Admin => 'Sistem Yöneticisi',
            self::Analyst => 'SOC Analisti',
            self::User => 'Standart Kullanıcı',
            self::Malware => 'Zararlı Yazılım Analisti',
            self::Engineer => 'Davranış Tespit Mühendisi',
            self::Developer => 'Uygulama Geliştiricisi',
        };
    }
}