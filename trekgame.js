const mapWidthQuadrants = 8;
const mapHeightQuadrants = 8;
const quadrantWidthSectors = 8;
const quadrantHeightSectors = 8;


function randomInt(min, max)
{
    return Math.round(Math.random() * (max-min) + min);
}

class Grid
{
    constructor(gridX, gridY, gridItemConstructor)
    {
        self.contents = new Array()

        self.width = gridX;
        self.height = gridY;
        self.size = gridX * gridY;

        self.lookup = function(x,y)
        {
            return contents [y * self.width + x];
        }

        for (let i = 0; i < self.size; i++)
        {
            self.contents[i] = gridItemConstructor();
        }
    }
}

class Quadrant
{
    constructor()
    {
        console.log("Quadrant constructor");
    }
}

class GalaxyMap extends Grid
{
    constructor(quadrantsX, quadrantsY)
    {
        super(quadrantsX, quadrantsY, function(){return new Quadrant()});
    }
}

class TrekGame
{
    constructor()
    {
        this.galaxyMap = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants);
    }
}

console.log("Hope you enjoy the game!");

game = new TrekGame();
