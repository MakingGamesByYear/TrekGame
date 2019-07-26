class MenuOption
{
    constructor(option, separator, description, payload)
    {
        this.option = option.toString();
        this.separator = separator;
        this.description = description;
        this.payload = payload;
        this.enabled = true;
    }

    compare(testString)
    {
        return testString.toLowerCase() == this.option.toLowerCase();
    }

    toString()
    {
        return this.option + this.separator + this.description + '\n';
    }
}

class Menu
{
    constructor()
    {
        this.options = [];
        this.headerString = "ENTER ONE OF THE FOLLOWING:\n";
    }

    getSelectedOption(optionText)
    {
        for (var x in this.options)
        {
            if (this.options[x].compare(optionText) && this.options[x].enabled)
            {
                return this.options[x];
            }
        }
        return null;
    }

    invalidOption()
    {
        gameOutputAppend("Come again, captain?");
        return false;
    }

    chooseOption(optionText)
    {
        var menuopt = this.getSelectedOption(optionText);
        if (menuopt)
        {
            return menuopt.payload();
        }
        return this.invalidOption(optionText);
    }

    toString()
    {
        return Menu.TypingFree ? this.toStringHyperlink() : this.toStringTyping();
    }

    toStringTyping()
    {
        var rstring = this.headerString;

        for (var x in this.options)
        {
            if (this.options[x].enabled)
            {
                rstring += this.options[x];
            }
        }

        return rstring;
    }

    toStringHyperlink()
    {
        var rstring = this.headerString;

        for (var x in this.options)
        {
            if (this.options[x].enabled)
            {
                let sb = "<pre><a href=\"javascript:game.gameInput('" + this.options[x].option + "');\"  style=\"color: rgb(0,255,0)\">";
                let sa = "</a></pre>"
                rstring += sb + this.options[x] + sa;
                console.log(sb + this.options[x] + sa);
            }
        }

        return rstring;
    }
}

Menu.TypingFree = false;