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
        gameOutputAppend("\nReport from sector " + this.sectorString());
        
        game.destroyKlingon(this);
    }

    onPhaserHit(energy, game)
    {
        console.log("Klingon::onPhaserHit");
        let shieldDeflectionLevel = Klingon.shieldDeflectionPercent * this.shields;

        gameOutputAppend("\nReport from sector " + this.sectorString());
        if (energy <= shieldDeflectionLevel)
        {
            gameOutputAppend("Phaser hit did no damage!");
        }
        else
        {
            gameOutputAppend("Phaser hit the klingon fighter for " + energy + " damage.");

            this.shields -= energy;

            if (this.shields <= 0)
            {
                game.destroyKlingon(this);
            }
            else
            {
                gameOutputAppend("" + this.shields + " units remain.");
            }
        }
    }

    phaserDamageBase()
    {
        let energyToFire = this.shields;
        let dist = this.distanceToObject(target);
        return Math.round(energyToFire / dist);
    }

    firePhasers(target, game)
    {
        let phaserDamage = this.phaserDamageBase() * randomInt(Klingon.MinPhaserMultiplier, Klingon.MaxPhaserMultiplier);

        gameOutputAppend("Hit from sector " + this.sectorString() + " for " + phaserDamage + " units");
        target.onPhaserHit(phaserDamage, game);
    }

    minPhaserDamage()
    {
        return Klingon.MinPhaserMultiplier * this.phaserDamageBase();
    }
    
    maxPhaserDamage()
    {
        return Klingon.MaxPhaserMultiplier * this.phaserDamageBase();
    }

    toString()
    {
        return "+K+";
    }
    
    static maxInstancesQuadrant()
    {
        return 4;
    }

    static quadrantInstanceProbabilities()
    {
        return [.9,  
                .025,
                .025,
                .0125,
                .00625
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