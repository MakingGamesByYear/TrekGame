class Grid
{
    constructor(gridX, gridY, gridItemConstructor = function(){return null;})
    {
        checkArgumentsDefinedAndHaveValue(arguments);

        this.contents = new Array()

        this.width = gridX;
        this.height = gridY;
        this.size = gridX * gridY;

        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
            {
                this.contents.push(gridItemConstructor(x, y));
            }
        }
    }

    lookup(x,y)
    {
        checkArgumentsDefinedAndHaveValue(arguments);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
        {
            return null;
        }

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

    toStringHyperlink()
    {
        let rval = "";
        for ( let y = 0; y < this.height; y++)
        {
            rval += padStringToLength(""+(y+1), 2) + '|';
            for (let x = 0; x < this.width; x++)
            {
                let lookupVal = this.lookup(x,y).toString();
                if (lookupVal == padStringToLength(' ', lookupVal.length))
                {
                    lookupVal = padStringToLength('.', lookupVal.length);
                }

                let catstr = "<a href=\"javascript:clickGridHandler("+x+","+y+")\" style=\"color: rgb(0,255,0); text-decoration: none;\">" + lookupVal + "</a>";
                rval += catstr;
            }
            rval += '|';
            rval += '\n';
        }
        return rval;
    }

    toStringTyping()
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

    toString()
    {
        return Grid.TypingFree ? this.toStringHyperlink() : this.toStringTyping();
    }
}

Grid.TypingFree = false;