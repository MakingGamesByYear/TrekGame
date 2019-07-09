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
        gameOutputAppend("\nReport from sector " + this.sectorString());
        gameOutputAppend("The torpedo strikes and destroys the friendly starbase! I bet you'll be court martialled for that one!");

        game.currentQuadrant.removeEntity(this);
        StarBase.Instances--;

        let removeSB = this;
        StarBase.starbaseList = StarBase.starbaseList.filter(function(item){return item != removeSB});

        if (game.enterprise.dockStarbase == removeSB)
        {
            game.enterprise.undock(removeSB);
        }
    }

    toString()
    {
        return ">!<";
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    static quadrantInstanceProbabilities()
    {
        // 5% chance of a starbase in any given quadrant
        return [.95, .05];
    }
}

StarBase.starbaseList = [];