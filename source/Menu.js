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
        var rstring = "ENTER ONE OF THE FOLLOWING:\n";

        for (var x in this.options)
        {
            if (this.options[x].enabled)
            {
                rstring += this.options[x];
            }
        }

        return rstring;
    }
}
