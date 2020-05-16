class Star extends GameObject
{
    constructor()
    {
        super(Star);
    }

    onTorpedoHit(game)
    {
        console.log("hit a star");
        gameOutputAppend("\nReport from sector " + this.subsectorString());
        gameOutputAppend("The star absorbs the torpedo without a trace.");
    }

    toString()
    {
        return "*";
    }

    static maxInstancesSector()
    {
        return 9;
    }
}