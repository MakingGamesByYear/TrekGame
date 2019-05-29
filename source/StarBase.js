class StarBase extends GameObject
{
    constructor()
    {
        super(StarBase);
    }

    onTorpedoHit(quadrant)
    {
        console.log("hit a starbase");
        gameOutputAppend("\nReport from sector " + this.sectorString());
        gameOutputAppend("The torpedo strikes and destroys the friendly starbase! I bet you'll be court martialled for that one!");

        quadrant.removeEntity(this);
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
}