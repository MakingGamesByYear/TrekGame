class Star extends GameObject
{
    constructor()
    {
        super(Star);
    }

    onTorpedoHit(game)
    {
        console.log("hit a star");
        gameOutputAppend("\nReport from sector " + this.sectorString(this.sectorX, this.sectorY));
        gameOutputAppend("The star absorbs the torpedo without a trace.");
    }

    toString()
    {
        return "*";
    }

    static maxInstancesQuadrant()
    {
        return 12;
    }
}