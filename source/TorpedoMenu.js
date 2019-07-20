class TorpedoMenu extends Menu
{
    constructor(targetList, trekgame)
    {
        super();

        this.options = [];

        for (var x = 0; x < targetList.length; x++)
        {
            let tgt = targetList[x];

            if (trekgame.enterprise.canSeeEntity(tgt))
            {
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
            else
            {
                this.options.push
                (
                    new MenuOption
                    (
                        x + 1,
                        ") ",
                        "???????#####?#??#???#??#??????????",
                        function()
                        {
                            gameOutputAppend("\nUnable to lock on to target due to short range sensor damage");
                            return true;
                        }
                    )
                );
            }
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