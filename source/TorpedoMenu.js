class TorpedoMenu extends Menu
{
    constructor(targetList, trekgame)
    {
        super();

        this.options = [];

        for (var x = 0; x < targetList.length; x++)
        {
            let targetHeading = trekgame.enterprise.angleToObject(targetList[x]);

            let tgt = targetList[x];

            this.options.push
            (
                new MenuOption
                (
                    x + 1,
                    ") ",
                    "TARGET AT SUBSECTOR ("+targetList[x].sectorString() + ")",
                    function()
                    {
                        trekgame.torpedoHandler(tgt);
                        return true;
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
                "MANUAL TARGETING",
                function()
                {
                    trekgame.manualTorpedoHandler();
                }
            )
        );

        this.options.push
        (
            new MenuOption
            (
                this.options.length + 1, 
                ") ",
                "BACK",
                function()
                {
                    console.log("back button");
                    return true;
                }
            )
        );
    }
}