class Star extends GameObject
{
    constructor()
    {
        super(Star);
    }

    onTorpedoHit()
    {
        console.log("hit a star");
        gameOutputAppend("\nReport from sector " + (this.sectorX + 1) + ", " + (this.sectorY+1));
        gameOutputAppend("The star absorbs the torpedo without a trace.");
    }

    toString()
    {
        return "*";
    }

    static maxInstancesQuadrant()
    {
        return 4;
    }
}