class StarBase extends GameObject
{
    constructor()
    {
        super(StarBase);
    }

    onTorpedoHit(game)
    {
        console.log("hit a starbase");
        gameOutputAppend("\nReport from sector " + this.sectorString());
        gameOutputAppend("The torpedo strikes and destroys the friendly starbase! I bet you'll be court martialled for that one!");

        game.currentQuadrant.removeEntity(this);
        StarBase.Instances--;
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