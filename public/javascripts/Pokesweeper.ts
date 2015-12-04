/// <reference path="MSObserver.ts" />
/// <reference path="Minesweeper.ts" />
/// <reference path="ImageMinesweeper.ts" />
/// <reference path="Timer.ts" />
/// <reference path="PokeUtil.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />

class Pokesweeper implements MSObserver {
    private ms: Minesweeper;
    protected rows: number;
    protected cols: number;
    private bombCount: number;
    private fieldDomId = '#field';
    private timer: Timer;
    /**
     * The key for Pokedex count in localStorage
     */
    private pokedexKey = 'pokedex';
    private timeCounterDomId = '#timeCounter';
    private highScoreDomId = '#highScoreCounter';
    private pokedexDomId = '#pokedexCounter';
    private bombCountDomId = '#bombCounter';
    private resetButtonDomId = '#resetButton';
    private resetButtonImage = 'url("/images/pikachu_button.png")';
    private happyButtonImage = 'url("/images/pikachu_button_happy.png")';
    private sadButtonImage = 'url("/images/pikachu_button_sad.png")';
    
    constructor(cells: string[][]) {
        this.rows = cells.length;
        this.cols = cells[0].length;
        this.ms = new ImageMinesweeper(cells, PokeUtil.getBombRatio());
        this.ms.addObserver(this);
        this.drawField();
        this.bindCells();
        this.bindResetButton();
        this.updateScores();
        this.updateBombCount(this.ms.getRemainingBombCount());
        this.timer = new Timer($(this.timeCounterDomId));
    }
    
    onGameStart() {
        this.timer.start();
    }
    
    onWaitingInput() {
        
    }
    
    onFieldChanged() {
        this.drawField();
        this.updateBombCount(this.ms.getRemainingBombCount());
        this.bindCells();
    }
    
    onBombStepped() {
        this.timer.stop();
        this.drawField();
        $(this.resetButtonDomId).css('background-image', this.sadButtonImage);
    }
    
    onVictory() {
        this.drawSprite();
        this.saveScore(this.timer.stop());
        $(this.resetButtonDomId).css('background-image', this.happyButtonImage);
    }
    
    private updateBombCount(bombs: number) {
        $(this.bombCountDomId).text(bombs);
    }
    
    private saveScore(score: number): void {
        if (!localStorage.getItem(currentId)) {
            // Solved for the first time
            localStorage.setItem(currentId, score.toString());
            
            var pokedex = localStorage.getItem(this.pokedexKey);
            localStorage.setItem(this.pokedexKey, (parseInt(pokedex) + 1).toString());
        } else {
            var highscore = parseInt(localStorage.getItem(currentId));
            localStorage.setItem(currentId, (Math.min(highscore, score)).toString());
        }
        
        this.updateScores();
    }
    
    private updateScores(): void {
        if (!localStorage.getItem(currentId)) {
            // Haven't solved this one yet
            $(this.highScoreDomId).text('--');
        } else {
            $(this.highScoreDomId).text(localStorage.getItem(currentId));
        }
        
        if (!localStorage.getItem(this.pokedexKey)) {
            localStorage.setItem(this.pokedexKey, '0');
        }
        
        $(this.pokedexDomId).text(localStorage.getItem(this.pokedexKey));
    }
    
    private drawField(): void {
        $(this.fieldDomId).empty();
        
        for (var row = 0; row < this.rows; row++) {
            $(this.fieldDomId).append('<div class="row" id="row' + row.toString() + '"></div>');
            
            for (var col = 0; col < this.cols; col++) {
                if (this.ms.isValidCell(row, col)) {
                    this.drawCell(row, col);
                } else {
                    this.drawEmptyCell(row, col);
                }
            }
        }
    }
    
    private drawSprite() {
        $(this.fieldDomId).empty();
        
        for (var row = 0; row < this.rows; row++) {
            $(this.fieldDomId).append('<div class="row" id="row' + row.toString() + '"></div>');
            
            for (var col = 0; col < this.cols; col++) {
                if (this.ms.isValidCell(row, col)) {
                    var cell = <ColorCell>this.ms.getCellAt(row, col);
                    this.drawCellWith(cell.color, row, col, true, false, false, cell.adjBombCount, false);
                } else {
                    this.drawEmptyCell(row, col);
                }
            }
        }
    }
    
    private bindCells(): void {
        var mouseDown = false;
        
        this.disableRightClick('.cell');
        
        $('.cell').mouseup((event: JQueryEventObject) => {
            mouseDown = false;
            
            var move = this.getCellMove($(event.target));
            
            if (event.which == 1) {
                // left click
                this.ms.makeMove(move.row, move.col);
            } else if (event.which == 3) {
                // right click
                this.ms.toggleFlag(move.row, move.col);
            }
        });
        
        $('.cell').mousedown((event: JQueryEventObject) => {
            mouseDown = true;
            
            setTimeout(() => {
                if (mouseDown) {
                    navigator.vibrate(1);
                    var move = this.getCellMove($(event.target));
                    this.ms.toggleFlag(move.row, move.col);
                }
            }, 300);
        });
    }
    
    private disableRightClick(tag: string): void {
        $(tag).on('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    private getCellMove(domCell: JQuery) {
        var row = parseInt(domCell.attr('row'));
        var col = parseInt(domCell.attr('col'));
        
        return { row: row, col: col };
    }
    
    /**
     * Returns the ID for the DOM element representing the cell at (row, col) without the hashtag
     */
    private getCellId(row: number, col: number): string {
        return 'cell' + row.toString() + '_' + col.toString();
    }
    
    private bindResetButton(): void {
        $(this.resetButtonDomId).mousedown(function() {
            $(this).removeAttr('style'); // remove hardcoded CSS style
        });
        
        $(this.resetButtonDomId).click(() => {
            this.ms.init();
            this.timer.stop();
        });
    }
    
    private drawEmptyCell(row, col) {
        var domCell = $('<div class="cell emptyCell"></div>');
        $('#row' + row.toString()).append(domCell);
    }
    
    private drawCell(row, col) {
        var cell = <ColorCell>this.ms.getCellAt(row, col);
        this.drawCellWith(cell.color, row, col, cell.open, cell.flag, cell.bomb, cell.adjBombCount, true);
    }
    
    private drawCellWith(color: string, row: number, col: number, open: boolean,
        flag: boolean, bomb: boolean, adjBombCount: number, showCount: boolean) {
        
        var domCell = $('<div/>', {
            class: 'cell',
            id: this.getCellId(row, col),
            row: row,
            col: col
        });
        
        if (open) {
            if (bomb) {
                domCell.addClass('bombCell');
            } else {
                domCell.css('background-color', '#' + color);
                
                if (adjBombCount != 0 && showCount) {
                    domCell.text(adjBombCount);
                }
            }
        } else {
            if (flag) {
                domCell.addClass('flaggedCell');
            } else {
                domCell.addClass('unopenCell');
            }
        }
        
        $('#row' + row.toString()).append(domCell);
    }
}