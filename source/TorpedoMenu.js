class TorpedoMenu extends Menu
{
    constructor(targetList, trekgame)
    {
        super();

        this.options = [];

        for (var x = 0; x < targetList.length; x++)
        {
            let targetHeading = trekgame.enterprise.angleToObject(targetList[x]);

            this.options.push
            (
                new MenuOption
                (
                    x + 1,
                    ") ",
                    "TARGET AT SUBSECTOR ("+targetList[x].sectorString() + ") : AT HEADING " + Math.round(targetHeading) + " DEGREES",
                    function()
                    {
                        trekgame.enterprise.fireTorpedo(trekgame, targetHeading);
                        trekgame.currentQuadrant.klingonsFire(trekgame.enterprise, trekgame);
                    }
                )
            );
        }

        this.options.push
        (
            new MenuOption
            (
                this.options.length + 1, 
                ") ",
                "Manual targeting",
                function()
                {
                    gameOutputAppend("Enter torpedo heading manually (in degrees).");
                    trekgame.awaitInput("Torpedo Heading (degrees)", 3, trekgame.torpedoHandler);
                }
            )
        );
    }
}