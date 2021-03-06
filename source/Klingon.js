class Klingon extends GameObject
{
    constructor()
    {
        super(Klingon);
        this.shields = randomInt(100, 300);
    }

    onTorpedoHit(game)
    {
        console.log("hit a klingon");
        gameOutputAppend("\nReport from subsector " + this.subsectorString());
        
        game.destroyKlingon(this);
    }

    onPhaserHit(energy, game)
    {
        console.log("Klingon::onPhaserHit");
        let shieldDeflectionLevel = Klingon.shieldDeflectionPercent * this.shields;

        gameOutputAppend("\nReport from subsector " + this.subsectorString());

        if (energy <= shieldDeflectionLevel)
        {
            gameOutputAppend("Phaser hit did no damage!");
        }
        else
        {
            let descStr = game.primeUniverse ? "klingon fighter" : " enemy ship";
            gameOutputAppend("Phaser hit the " + descStr + " for " + energy + " damage.");

            this.shields -= energy;

            if (this.shields <= 0)
            {
                game.destroyKlingon(this);
            }
            else
            {
                if (game.currentSectorScanned)
                {
                    if (game.enterprise.canSeeEntity(this))
                    {
                       gameOutputAppend("" + this.shields + " units remain.");
                    }
                    else
                    {
                        gameOutputAppend("Sensor damage prevents reading the enemy's shields!");
                    }
                }
            }
        }
    }

    phaserDamageBase(dist)
    {
        let energyToFire = this.shields;
        return Math.round(energyToFire / dist);
    }

    firePhasers(target, game)
    {
        let dist = this.distanceToObject(target);
        let phaserDamage = this.phaserDamageBase(dist) * randomInt(Klingon.MinPhaserMultiplier, Klingon.MaxPhaserMultiplier);

        let sstr = game.enterprise.canSeeEntity(this) ? this.subsectorString() : " ???? ";
        gameOutputAppend("\nHit from subsector " + sstr + " for " + phaserDamage + " units");
        target.onPhaserHit(phaserDamage, game);
    }

    minPhaserDamage()
    {
        return Klingon.MinPhaserMultiplier * this.phaserDamageBase(1);
    }
    
    maxPhaserDamage()
    {
        return Klingon.MaxPhaserMultiplier * this.phaserDamageBase(1);
    }

    toString()
    {
        return Klingon.stringRepresentation;
    }
    
    static maxInstancesSector()
    {
        return 4;
    }

    static sectorInstanceProbabilities()
    {
        return [.9,     // %chance 0 klingons
                .025,
                .025,
                .0125,
                .00625  // %chance 4 klingons
        ];
    }

    static maxInstancesGame()
    {
        return 18;
    }

    static minInstancesGame()
    {
        return minKlingonsGame;
    }
}

Klingon.shieldDeflectionPercent = .15;
Klingon.InstancesDestroyed = 0;
Klingon.MaxPhaserMultiplier = 3;
Klingon.MinPhaserMultiplier = 2;

Klingon.stringRepresentation = "+K+";