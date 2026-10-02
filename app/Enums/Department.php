<?php

declare(strict_types=1);

namespace App\Enums;

enum Department: string
{
    case SocThreatHunting = 'detection_engineering';
    case HumanResources = 'human_resources';
    case Developer = 'software_developing'; 
    case Malware = 'malware_analysis';

    public function label(): string
    {
        return match($this) {
            self::SocThreatHunting => 'SIEM & Detection Engineering',
            self::HumanResources => 'Human Resources',
            self::Developer => 'Software Developing',
            self::Malware => 'Malware Analysis'
        };
    }
}
