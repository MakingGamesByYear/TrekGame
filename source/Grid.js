class Grid
{
    constructor(gridX, gridY, gridItemConstructor)
    {
        checkArgumentsDefinedAndHaveValue(arguments);

        this.contents = new Array()

        this.width = gridX;
        this.height = gridY;
        this.size = gridX * gridY;

        for (let i = 0; i < this.size; i++)
        {
            this.contents[i] = gridItemConstructor();
        }
    }

    lookup(x,y)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        return this.contents [y * this.width + x];
    }

    // 1D array based lookup
    lookup1D(x)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        return this.contents[x];
    }

    setValue(x,y,val)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.contents [y * this.width + x] = val;
    }

    setValue1D(x, val)
    {
        this.contents[x] = val;
    }

    getEmptySquare()
    {
        let startIndex = randomInt(0, this.contents.length-1);
        let emptyIndex = null;

        for (let i = 0; i < this.contents.length; i++)
        {
            let lookup = ( startIndex + i ) % this.contents.length;
            if (!this.contents.lookup)
            {
                emptyIndex = i;
                break;
            }
        }

        if (emptyIndex)
        {
            let rx = emptyIndex % this.width;
            let ry = emptyIndex / this.height;

            return {x : rx, y:ry};
        }
        
        return null;
    }

    toString()
    {
        let rval = "";
        for ( let y = 0; y < this.height; y++)
        {
            rval += padStringToLength(""+(y+1), 2) + '|';
            for (let x = 0; x < this.width; x++)
            {
                let catstr = this.lookup(x,y).toString();
                rval += catstr;
            }
            rval += '|';
            rval += '\n';
        }
        return rval;
    }
}