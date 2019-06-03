class ShipComputerMenu extends Menu
{
    constructor(trekGame)
    {
        super();
        this.options = [];

        this.options.push(

            new MenuOption
            (
                "1",
                ") ",
                "GALACTIC RECORD",
                function()
                {
                }
            ),

            new MenuOption
            (
                "2",
                ") ", 
                "STATUS REPORT",
                function()
                {
                    /*
                    - KLINGONS REMAINING
                    - TIME REMAINING
                    - STARBASES REMAINING
                    - DAMAGE REPORT
                    */
                }
            ),

            new MenuOption
            (
                "3",
                ") ", 
                "SCAN ENEMY SHIPS",
                function()
                {

                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "STARBASES",
                function()
                {

                }
            ),

            new MenuOption
            (
                "5",
                ") ",
                "DIRECTION / DISTANCE CALCULATOR",
                function()
                {

                } 
            ),

            new MenuOption
            (
                "6",
                ") ",
                "QUADRANT NAME MAP",
                function()
                {

                }
            ) 
        );
    }
}