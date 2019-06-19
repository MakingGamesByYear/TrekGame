class TorpedoMenu extends Menu
{
    constructor(targetList, enterprise)
    {
        super();

        this.options = [];

        for (var x = 0; x < targetList.length; x++)
        {
            this.options.push
            (
                new MenuOption
                (
                    x + 1,
                    ") ",
                    "TARGET AT SUBSECTOR ("+targetList[x].sectorString() + ") : AT HEADING " + enterprise.angleToObject(targetList[x])+ " DEGREES",
                    function()
                    {
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
                }
            )
        );
    }
}