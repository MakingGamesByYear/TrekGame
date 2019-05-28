class Klingon extends GameObject
{
    constructor()
    {
        super(Klingon);
        this.shields = randomInt(100, 300);
    }

    onTorpedoHit(quadrant)
    {
        console.log("hit a klingon");
        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
        gameOutputAppend("Klingon Fighter Destroyed");

        quadrant.removeEntity(this);
    }

    onPhaserHit(energy, quadrant)
    {
        console.log("Klingon::onPhaserHit");
        let shieldDeflectionLevel = Klingon.shieldDeflectionPercent * this.shields;

        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
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
                gameOutputAppend("Klingon Fighter Destroyed");
                quadrant.removeEntity(this);
            }
            else
            {
                gameOutputAppend("" + this.shields + " units remain.");
            }
        }
    }

    toString()
    {
        return "+K+";
    }
    
    static maxInstancesQuadrant()
    {
        return 4;
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