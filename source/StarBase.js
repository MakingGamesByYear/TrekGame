class StarBase extends GameObject
{
    constructor()
    {
        super(StarBase);
        StarBase.starbaseList.push(this);
    }

    onTorpedoHit(game)
    {
        console.log("hit a starbase");

        game.currentSector.removeEntity(this);
        StarBase.Instances--;

        let removeSB = this;
        StarBase.starbaseList = StarBase.starbaseList.filter(function(item){return item != removeSB});

        if (game.enterprise.dockStarbase == removeSB)
        {
            game.enterprise.undock(removeSB);
        }

        game.checkStarbaseDock();

        gameOutputAppend("\nReport from sector " + this.subsectorString());
        if (game.primeUniverse)
        {
            gameOutputAppend("The torpedo strikes and destroys the friendly starbase! I bet you'll be court martialled for that one!");
        }
        else
        {
            gameOutputAppend("The torpedo strikes and destroys the Imperial starbase! Starfleet orders your second in command to throw you in the agonizer booth, costing you a Stardate.");
            game.advanceStardate(1.0);
        }
    }

    toString()
    {
        return ">!<";
    }

    static maxInstancesSector()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    static sectorInstanceProbabilities()
    {
        // 5% chance of a starbase in any given quadrant
        return [.95, .05];
    }
}

StarBase.starbaseList = [];