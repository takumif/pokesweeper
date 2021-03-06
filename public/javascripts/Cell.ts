class Cell {
    open: boolean;
    bomb: boolean;
    flag: boolean;
    adjBombCount: number;
    adjCells: Cell[];
    row: number;
    col: number;
    
    constructor(bomb: boolean) {
        this.bomb = bomb;
        this.open = false;
        this.flag = false;
        this.adjBombCount = 0;
        this.adjCells = [];
    }
}