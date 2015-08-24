/// <reference path="play.board.ts" />
/// <reference path="play.cell.renderer.ts" />

module trains.play {

    export class Cell {

        public happy: boolean;
        public x: number;
        public y: number;
        public direction: trains.play.Direction;

        constructor(private board: trains.play.Board, public id: string, public column: number, public row: number) {
            this.happy = false;
            this.x = this.column * trains.play.gridSize;
            this.y = this.row * trains.play.gridSize;
            this.direction = trains.play.Direction.None;
        }

        draw(context: CanvasRenderingContext2D): void {
            context.save();

            context.translate(this.x + 0.5, this.y + 0.5);
            trains.play.CellRenderer.clearCell(context);

            switch (this.direction) {
                case trains.play.Direction.Horizontal:
                    {
                        var neighbours = this.board.getNeighbouringCells(this.column, this.row);
                        trains.play.CellRenderer.drawStraightTrack(context, neighbours.left === undefined, neighbours.right === undefined);
                        break;
                    }
                case trains.play.Direction.Vertical:
                    {
                        var neighbours = this.board.getNeighbouringCells(this.column, this.row);
                        context.translate(trains.play.gridSize, 0);
                        context.rotate(Math.PI / 2);
                        trains.play.CellRenderer.drawStraightTrack(context, neighbours.up === undefined, neighbours.down === undefined);
                        break;
                    }
                case trains.play.Direction.LeftUp:
                    {
                        trains.play.CellRenderer.drawCurvedTrack(context);
                        break;
                    }
                case trains.play.Direction.LeftDown:
                    {
                        context.translate(0, trains.play.gridSize);
                        context.rotate(Math.PI * 1.5);
                        trains.play.CellRenderer.drawCurvedTrack(context);
                        break;
                    }
                case trains.play.Direction.RightUp:
                    {
                        context.translate(trains.play.gridSize, 0);
                        context.rotate(Math.PI / 2);
                        trains.play.CellRenderer.drawCurvedTrack(context);
                        break;
                    }
                case trains.play.Direction.RightDown:
                    {
                        context.translate(trains.play.gridSize, trains.play.gridSize);
                        context.rotate(Math.PI);
                        trains.play.CellRenderer.drawCurvedTrack(context);
                        break;
                    }
            }

            context.restore();
        }

        checkYourself(): void {
            var neighbours = this.board.getNeighbouringCells(this.column, this.row);

            var changed = this.determineDirection(neighbours);
            this.happy = (neighbours.all.length > 1);
            this.draw(this.board.trackContext);

            if (changed) {
                var neighbours = this.board.getNeighbouringCells(this.column, this.row);
                neighbours.all.forEach(n => n.checkYourself());
            }
        }

        determineDirection(neighbours: trains.play.NeighbouringCells): boolean {
            if (this.happy) return false;

            var newDirection: trains.play.Direction;
            if (neighbours.left !== undefined && neighbours.right === undefined && neighbours.up !== undefined) {
                newDirection = trains.play.Direction.LeftUp;
            }

            else if (neighbours.left !== undefined && neighbours.right === undefined && neighbours.down !== undefined) {
                newDirection = trains.play.Direction.LeftDown;
            }

            else if (neighbours.left === undefined && neighbours.right !== undefined && neighbours.up !== undefined) {
                newDirection = trains.play.Direction.RightUp;
            }

            else if (neighbours.left === undefined && neighbours.right !== undefined && neighbours.down !== undefined) {
                newDirection = trains.play.Direction.RightDown;
            }
            // greedy vertical and horizontal joins    
            else if (neighbours.up !== undefined && neighbours.down !== undefined) {
                newDirection = trains.play.Direction.Vertical;
            }
            else if (neighbours.left !== undefined && neighbours.right !== undefined) {
                newDirection = trains.play.Direction.Horizontal;
            }
            // now less fussy vertical and horizontal joins    
            else if (neighbours.up !== undefined || neighbours.down !== undefined) {
                newDirection = trains.play.Direction.Vertical;
            }
            else if (neighbours.left !== undefined || neighbours.right !== undefined) {
                newDirection = trains.play.Direction.Horizontal;
            }
            else {
                newDirection = trains.play.Direction.Horizontal;
            }

            if (newDirection !== undefined && newDirection !== this.direction) {
                this.direction = newDirection;
                return true;
            }

            return false;
        }

        isConnectedUp(): boolean {
            return this.direction === Direction.Vertical ||
                this.direction === Direction.LeftUp ||
                this.direction === Direction.RightUp;
        }

        isConnectedDown(): boolean {
            return this.direction === Direction.Vertical ||
                this.direction === Direction.LeftDown ||
                this.direction === Direction.RightDown;
        }

        isConnectedLeft(): boolean {
            return this.direction === Direction.Horizontal ||
                this.direction === Direction.LeftUp ||
                this.direction === Direction.LeftDown;
        }

        isConnectedRight(): boolean {
            return this.direction === Direction.Horizontal ||
                this.direction === Direction.RightDown ||
                this.direction === Direction.RightUp;
        }

        destroy(): JQueryDeferred<{}> {
            var def = $.Deferred();
            this.destroyLoop(def, 0);

            def.done(() => {
                this.board.trackContext.clearRect(this.x, this.y, trains.play.gridSize, trains.play.gridSize);
            });

            return def;
        }

        destroyLoop(deferred: JQueryDeferred<{}>, counter: number): void {
            setTimeout(() => {
                var x = Math.floor(Math.random() * trains.play.gridSize);
                var y = Math.floor(Math.random() * trains.play.gridSize);

                this.board.trackContext.clearRect(this.x + x, this.y + y, 5, 5);
                counter++;
                if (counter < 40) {
                    this.destroyLoop(deferred, counter);
                } else {
                    deferred.resolve();
                }
            }, 10);
        }

        magicBullshitCompareTo(pen: number, sword: number): number {
            if (pen === sword) return 0;
            if (pen > sword) return -1;
            return 1;
        }

        getNewCoordsForTrain(coords: trains.play.TrainCoords): trains.play.TrainCoords {

            if(this.direction === trains.play.Direction.Vertical)
            {
                return {
                    currentX: this.x + (trains.play.gridSize/2),
                    currentY: coords.currentY + (10 * this.magicBullshitCompareTo(coords.previousY, coords.currentY)),
                    previousX: coords.currentX,
                    previousY: coords.currentY
                };
            }
            else if(this.direction === trains.play.Direction.Horizontal)
            {
                return {
                    currentX: coords.currentX + (10 * this.magicBullshitCompareTo(coords.previousX, coords.currentX)),
                    currentY: this.y + (trains.play.gridSize/2),
                    previousX: coords.currentX,
                    previousY: coords.currentY
                };
            }

            var yFlip = 1;
            if(this.direction === trains.play.Direction.RightDown || this.direction === trains.play.Direction.LeftDown)
            {
                yFlip = -1;
            }

            var xFlip =-1;
            if(this.direction === trains.play.Direction.RightUp || this.direction === trains.play.Direction.LeftUp)
            {
                xFlip = 1;
            }

            var xOffsetFromGrid = (coords.currentX - this.x) * xFlip;
            var yOffsetFromGrid = (coords.currentY - this.y) * yFlip;

            var yFlipLast = 1;
            if(this.direction === trains.play.Direction.RightDown || this.direction === trains.play.Direction.LeftDown)
            {
                yFlipLast = -1;
            }

            var xFlipLast = -1;
            if(this.direction === trains.play.Direction.RightUp || this.direction === trains.play.Direction.RightDown)
            {
                xFlipLast = 1;
            }

            var xOffsetFromGridLast = (coords.previousX - this.x) * xFlipLast;
            var yOffsetFromGridLast = (coords.previousY - this.y) * yFlipLast;

            var angle = Math.atan2(yOffsetFromGrid,xOffsetFromGrid);
            var angleLast = Math.atan2(yOffsetFromGridLast,xOffsetFromGridLast);
            var newAngle = (Math.PI/90) * this.magicBullshitCompareTo(angleLast,angle);

            var xOffsetFromGridNew = ((trains.play.gridSize/2)*Math.cos(newAngle)) * xFlip;
            var yOffsetFromGridNew = ((trains.play.gridSize/2)*Math.sin(newAngle)) * yFlip;
            window.console.log("Step: "+xOffsetFromGrid+","+yOffsetFromGrid+" "+angle+" "+newAngle+" flipy:"+yFlip+" flipx:"+xFlip);
            return {
                currentX: this.x + xOffsetFromGridNew,
                currentY: this.y + yOffsetFromGridNew,
                previousX: coords.currentX,
                previousY: coords.currentY
            };
        }
    }

    export interface TrainCoords {
        currentX: number;
        currentY: number;
        previousX: number;
        previousY: number;
    }
}