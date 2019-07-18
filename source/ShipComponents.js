class ShipComponent
{
    constructor (componentName, damProb)
    {
        this.componentHealth = 1.0; //percent
        this.componentName = componentName;
        this.componentDamageProbability = damProb;
    }

    damageReport()
    {
    }
}

class WarpEnginesComponent extends ShipComponent
{
    constructor()
    {
        super("Warp Engines", .0625);
    }
}

class ShortRangeSensorsComponent extends ShipComponent
{
    constructor()
    {
        super("Short Range Sensors", .0625);
    }

    fullyFunctional()
    {
        return this.componentHealth > ShortRangeSensorsComponent.FullyFunctionalHealth;
    }

    chanceCorrupt()
    {
        // goes from 0 when the component is at the maximum health in range, to 1 when the component is at 0%
        let hnorm = (ShortRangeSensorsComponent.FullyFunctionalHealth - this.componentHealth) / ShortRangeSensorsComponent.FullyFunctionalHealth;

        // lerp
        let chanceCorrupt = (1.0 - hnorm) * ShortRangeSensorsComponent.MinChanceCorrupt + hnorm * ShortRangeSensorsComponent.MaxChanceCorrupt;

        return chanceCorrupt;
    }

    damageReport()
    {
        if (!this.fullyFunctional())
        {
            gameOutputAppend("Short range sensors are damaged.  Map display may be corrupted.");
        }
    }
}

ShortRangeSensorsComponent.FullyFunctionalHealth = .7;   // short range scan fully functional above this health
ShortRangeSensorsComponent.MinChanceCorrupt = .1;        // For a particular sector on the map, minimum chance it'll be corrupt when integrity is high
ShortRangeSensorsComponent.MaxChanceCorrupt = .75;       // For a particular sector on the map, maximum chance it'll be corrupt when integrity is low

class LongRangeSensorsComponent extends ShipComponent
{
    constructor()
    {
        super ("Long Range Sensors", .25);
    }
}

class PhaserControlComponent extends ShipComponent
{
    constructor()
    {
        super ("Phaser Control", .0625);
    }
}

class PhotonTubesComponent extends ShipComponent
{
    constructor()
    {
        super ("Photon Tubes", .125);
    }

    canFire()
    {
        return this.componentHealth > PhotonTubesComponent.DisabledThreshold;
    }

    targetingAvailable()
    {
        return this.componentHealth > PhotonTubesComponent.DamagedThreshold;
    }

    damageReport()
    {
        if (this.canFire())
        {
            if (!this.targetingAvailable())
            {
               gameOutputAppend("Due to damage, torpedo targeting computer is nonfunctional.  You will need to input torpedo trajectories manually until the system is repaired.");
            }
        }
        else
        {
            gameOutputAppend("Torpedo tubes too damaged to fire.");
        }
    }
}

PhotonTubesComponent.DamagedThreshold = .5; // 50% health = automatic targeting is down.
PhotonTubesComponent.DisabledThreshold = .25; // 25% health = can't fire torpedoes.

class DamageControlComponent extends ShipComponent
{
    constructor()
    {
        super("Damage Control", .0625);
    }
}

class ShieldControlComponent extends ShipComponent
{
    constructor()
    {
        super ("Shield Control", .125);
    }
}

class LibraryComputerComponent extends ShipComponent
{
    constructor()
    {
        super ("Library Computer", .25);
    }

    mapsAccessible()
    {
        return this.componentHealth > LibraryComputerComponent.DamagedThreshold;
    }

    damageReport()
    {
        if (!this.mapsAccessible())
        {
            gameOutputAppend("Ship computer is too damaged to access maps.");
        }
    }
}

LibraryComputerComponent.DamagedThreshold = .25; // 25% health = can't access maps.