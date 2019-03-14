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
    constructor(gridX, gridY)
    {
        self.contents = new Array()

        self.width = gridX;
        self.height = gridY;

        self.lookup = function(x,y)
        {
            return contents [y * self.width + x];
        }
    }
}

class GalaxyMap extends Grid
{
    constructor(quadrantsX, quadrantsY)
    {
        super(quadrantsX, quadrantsY, );
    }
}

class TrekGame
{
    constructor()
    {   
        this.galaxyMap = new GalaxyMap();
    }
}
