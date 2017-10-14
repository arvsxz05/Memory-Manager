class MemoryHole {
	constructor (code, size) {
		this.code = code;
		this.size = size;
		this.allocated = null;
	}
}

class JobEntry {
	constructor (code, time, size) {
		this.code = code;
		this.time = time;
		this.size = size;
		this.waitingTime = 0;
		this.remaining = time;
		this.color = getRandomColor();
	}
}

class BatchJobs {
	constructor() {
		this.joblist = [];
	}

	addJob(newJob) {
		if(!newJob || !(newJob instanceof JobEntry))
			throw "Job must be valid.";

		this.joblist.push(newJob);
	}

	resetRemaining() {
		for (var i = this.joblist.length - 1; i >= 0; i--) {
			this.joblist[i].remaining = this.joblist[i].time;
		}
	}
}

class MemoryList {
	constructor() {
		this.memories = [];
	}

	clearAllocations() {
		for (var i = this.memories.length - 1; i >= 0; i--) {
			this.memories[i].allocated = null;
		}
	}

	addMemory(newMemory) {
		if(!newMemory || !(newMemory instanceof MemoryHole))
			throw "Memory must be valid.";

		this.memories.push(newMemory);
	}

	sortMemories(order) {
		if(order === true) {
			memories.sort(function(a, b) {
				var x = a.size; var y = b.size;
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			});
		} else if (order === false) {
			memories.sort(function(a, b) {
				var x = a.size; var y = b.size;
				return ((x > y) ? -1 : ((x < y) ? 1 : 0));
			});
		} else {
			throw "Please pass 'true' if order of memory size is increasing, otherwise pass 'false'";
		}
	}
}

class System {
	constructor (memoryList, batchJobs) {
		if(!memoryList || !(memoryList instanceof MemoryList))
			throw "A valid MemoryList instance must be passed";
		if(!batchJobs || !(batchJobs instanceof BatchJobs))
			throw "A valid BatchJobs instance must be passed";

		this.memoryList = memoryList;
		this.batchJobs = batchJobs;
		this.timerCounter = null
		this.unallocatedJobs = [];
	}

	performFirstFit(realTime) {
		this.memoryList.clearAllocations();
		this.batchJobs.resetRemaining();
		var interval = 10;
		var ongoingJobs = 0;
		var internalFragmentation = 0;
		if (realTime) {
			interval = 1000;
		}
		// console.log(this.batchJobs.joblist.length);
		for (var i = 0; i < this.batchJobs.joblist.length; i++) {
			// console.log("besh");
			var j = 0;
			for (; j < this.memoryList.memories.length; j++) {
				if (this.memoryList.memories[j].allocated === null && this.memoryList.memories[j].size >= this.batchJobs.joblist[i].size) {
					this.memoryList.memories[j].allocated = this.batchJobs.joblist[i];
					internalFragmentation += this.memoryList.memories[j].size - this.batchJobs.joblist[i].size;
					ongoingJobs++;
					break;
				}
			}
			if (j == this.memoryList.memories.length) {
				this.unallocatedJobs.push(this.batchJobs.joblist[i]);
			}
		}

		this.timerCounter = setInterval(function() {
			var j = 0;
			for (var i = 0; i < this.unallocatedJobs.length; i++) {
				this.unallocatedJobs[i].waitingTime += 1;
			}
			for (; j < this.memoryList.memories.length; j++) {
				if (this.memoryList.memories[j].allocated !== null) {
					this.memoryList.memories[j].allocated.remaining --;
					if(this.memoryList.memories[j].allocated.remaining === 0) {
						ongoingJobs--;
						this.memoryList.memories[j].allocated = null;

						for (var i = 0; i < this.unallocatedJobs.length; i++) {
							if(this.unallocatedJobs[i].size <= this.memoryList.memories[j].size) {
								this.memoryList.memories[j].allocated = this.unallocatedJobs[i];
								internalFragmentation += this.memoryList.memories[j].size - this.unallocatedJobs[i].size;
								this.unallocatedJobs.splice(i--, 1);
								ongoingJobs++;
								break;
							}
						}
					}
				}
			}

			if (ongoingJobs == 0) {
				var aveWaitingTime = 0;
				for (var i = this.batchJobs.joblist.length - 1; i >= 0; i--) {
					aveWaitingTime += this.batchJobs.joblist[i].waitingTime;
				}
				console.log(this);
				console.log(aveWaitingTime + " " + internalFragmentation);
				clearInterval(this.timerCounter);
				this.timerCounter = null;
			}
		}.bind(this), interval);
	}
}

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}