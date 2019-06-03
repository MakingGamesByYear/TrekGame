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
                "Galactic Record",
                function()
                {
                }
            ),

            new MenuOption
            (
                "2",
                ") ", 
                "Status Report",
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
                "Scan Enemy Ships",
                function()
                {

                }
            ),

            new MenuOption
            (
                "4",
                ") ",
                "Starbases",
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