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
        gameOutputAppend("Klingon Fighter Destroyed");

        game.currentQuadrant.removeEntity(this);
        Klingon.Instances--;
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
                gameOutputAppend("Klingon Fighter Destroyed");
                game.currentQuadrant.removeEntity(this);
                Klingon.Instances--;
            }
            else
            {
                gameOutputAppend("" + this.shields + " units remain.");
            }
        }
    }

    firePhasers(target)
    {

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
