class Star extends GameObject
{
    constructor()
    {
        super(Star);
    }

    onTorpedoHit()
    {
        console.log("hit a star");
        gameOutputAppend("\nReport from sector " + sectorString(this.sectorX, this.sectorY));
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