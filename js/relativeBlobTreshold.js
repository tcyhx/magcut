//relativeBlobTreshold
/*
Input:  föregående blobmap
		nuvarande blobmap
		blobNr, vilken blob vi har clickat

*/
"use strict";

var testData = 	[0,1,1,1,1,1,1,1,1,1,
			 0,1,2,2,2,2,2,2,1,1,
			 0,1,2,3,3,3,3,3,1,1,
			 0,1,2,3,4,4,4,3,1,1,
			 0,1,2,3,4,5,5,3,1,1,
			 0,1,2,3,4,5,5,3,1,1,
			 0,1,2,3,4,4,4,3,1,1,
			 0,1,2,3,3,3,3,3,1,1,
			 0,1,2,2,2,2,2,2,1,1,
			 0,1,1,1,1,1,1,1,1,1];

////////////////////////////////////////////////////////////

var TSTEP = 1;

(function(_this){
    _this['relativeBlobTreshold'] = function(id, srcPixels, xSize, ySize, thresBlob, clickedPos, gBlobSize, genImageData){

        var myId = id;
        var myXsize = xSize;
        var myYsize = ySize;
		var initTreshold = 0;
		var statfind = new profiler();
		var gGauss = srcPixels.r;
		statfind.add("features");  
		
		var labled = findBlobs(srcPixels.g, xSize, ySize, thresBlob);

		var globalLabeled = labled.data.slice();
				
		var labeledClickedPos = labled.data[clickedPos];
		var ourSelectedRegion = [];
		console.log("labled clickedPos", labeledClickedPos);
		for(var x=0; x<labled.data.length; x++){
			if(labled.data[x] != labeledClickedPos){
				labled.data[x] = 0;
			}
			else{
				labled.data[x] = -1;
				ourSelectedRegion.push(x);
			}
		}


		function computeSize(threshold){
			var labledr = findBlobs(srcPixels.r, xSize, ySize, threshold); ///
			// var labledr = findBlobs_nopush(srcPixels.r, xSize, ySize, threshold);

			var uniqueLaledr = unique(labledr.data);
			//loop through the image and count the apperance of labels
			var labelAppearence = new Array(ourSelectedRegion.length);
			for(var x=0; x<ourSelectedRegion.length; x++){
				 labelAppearence[x] = labledr.data[ourSelectedRegion[x]];
			}

			var uniqueWithinGlobalBlob = unique(labelAppearence);

		    var label, max = 0, maxLabel = 999999;
		    for( label in uniqueWithinGlobalBlob ){
		      if(label != 0){
		        if(uniqueWithinGlobalBlob[label] > max){
		          max = uniqueWithinGlobalBlob[label];
		          maxLabel = label;
		        }
		      }
		    }

		    // console.log(uniqueLaledr[maxLabel], "the one to include in regression");
		    return {"reg": uniqueLaledr[maxLabel], "max":max, "label":Number(maxLabel)};
		}

		
		var mySeequedLabel = 999999;
		var theMostSimilarThreshold = 0;

		function findClosestTinRelativeDistance(){
			// var Tf = [10, 15, 20, 25, 30, 40, 60, 80, 100];
			var Tf = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
			// var Tf = [90, 100];
			var regressionData = [];
			var currTf = 0;
			var maxFound = {};
			for(var x=0; x<Tf.length; x++){
				// console.log(Tf[x]);
				maxFound = computeSize(Tf[x]); 

				// console.log("maxFound", maxFound.reg, gBlobSize, currTf);
				regressionData.push([maxFound.reg, Tf[x]]);

				currTf = Tf[x];

				if( maxFound.reg <= gBlobSize)
					break;


			}

			console.log("Currrrent:", currTf);
			var prevMax = 0;
			do {
				prevMax = maxFound.reg;

				maxFound = computeSize( --currTf); 
				console.log("min maxFound, reg", maxFound.reg, "max" ,maxFound.max, "g Size", gBlobSize, "px   currTf",  currTf);
				// console.log(maxFound);
				if( maxFound.reg >= gBlobSize || currTf <= 0)
					break;

			} while(true);

			theMostSimilarThreshold = 0;
			if( Math.abs(prevMax - gBlobSize) < Math.abs(maxFound.reg - gBlobSize)){
				theMostSimilarThreshold = currTf + 1;
			}
			else{
				theMostSimilarThreshold = currTf;
			}

			console.log("theMostSimilarThreshold", theMostSimilarThreshold, "gave:", maxFound);
			var labledRelative = findBlobs(srcPixels.r, xSize, ySize, theMostSimilarThreshold);
			mySeequedLabel = maxFound.label;
			
			return labledRelative.data;
		}

		statfind.start("features");
		var myBlob = findClosestTinRelativeDistance();

		statfind.stop("features");
		console.log("find closest T done in:", statfind.log(1), "ms"); 
		// printa32(myBlob, 32);

		//now we need to create the distances
		
		var labeledClickedPos = globalLabeled[clickedPos];

		console.log("global label:");
		// printa32(globalLabeled, 32);

		var relativeLabelsInsideGlobalLabels = [];
		for(var i=0; i<globalLabeled.length; i++){
			if(globalLabeled[i] == labeledClickedPos){
				// console.log("vi hae eb hiiiiiiiiiiiit", myBlob[i], i);
				if(myBlob[i] !== 0){
					relativeLabelsInsideGlobalLabels.push(myBlob[i]);
				}			
			}
		}
		var utest = unique(relativeLabelsInsideGlobalLabels);
		console.log(utest); 

		var label, max = 0, maxLabel = 99999;
	    for( label in utest ){
	        if(utest[label] > max){
	          max = utest[label];
	          maxLabel = label;
	        }
	    }

	    maxLabel = Number(maxLabel);

	    console.log("maxLabel", maxLabel, "compare to", mySeequedLabel);

	    var labledRelative = myBlob.slice();
	    var indexDone = zeros(myBlob.length);
		// we need to put -1 i den regionen vi ska utgå ifrån
		for(var x=0; x<labledRelative.length; x++){
			if(labledRelative[x] != maxLabel){
				labledRelative[x] = 0;
				myBlob[x] = 0;
			}
			else{
				labledRelative[x] = -1;
				myBlob[x] = myId;
				indexDone[x] = 1;
			}
		}

		statfind.start("features");		
		// getDistances(srcPixels.r, labledRelative, xSize, ySize);
		getDistanceswQue(srcPixels.r, labledRelative, xSize, ySize, indexDone, genImageData);

		statfind.stop("features");
		console.log("distances created in:", statfind.log(1), "ms"); 
		// console.log("myBlob");
		// printa32(myBlob, 32);

		// var dists = numeric.add(gradients,labledRelative.data);
		var dists = numeric.round(labledRelative);
		if(dists.length == 1024){
			printa32(dists, 32);
		}

		//hitta den nya selected region
		//som är den största labeln som (i deń nya datan) som finns innanför regionen


		var decIndx = [];
		var decVal = [];

		// callback(myBlob);
		 
        return{
            printId: function() {
                console.log("The ID is:", myId);
                return this.id;
            },
            updateThresholdIncreas: function() {
                initTreshold++;
                console.log("The ID is:", myId, initTreshold);
                if (initTreshold > 0) {

                	console.log("Do dists");

					subtactOne(dists, myXsize, myYsize, decIndx, decVal);
					myBlob = dists.slice(); 
					makeBlob(myBlob, myId, xSize, ySize);

					console.log("myBlob", dists.length);
					if( dists.length == 1024){
						printa32(myBlob, 32)
					}
				}
				else{
					theMostSimilarThreshold--;
					console.log("do something else w", theMostSimilarThreshold);
					var labledr = findBlobs(gGauss, myXsize, myYsize, theMostSimilarThreshold);

					var labelAppearence = new Array(ourSelectedRegion.length);
					for(var x=0; x<ourSelectedRegion.length; x++){
						 labelAppearence[x] = labledr.data[ourSelectedRegion[x]];
					}

				 	var maxL = findBiggestBlob(labelAppearence);

					for(var x=0; x<labledr.data.length; x++){
						if(labledr.data[x] !== maxL.label){
							labledr.data[x] = 0;
						}
						else{
							labledr.data[x] = myId;
						}
					}

					return labledr.data.slice();
				}

				return myBlob;
            },
            updateThresholdDecreas: function() {
                initTreshold--;
                console.log("dec The ID is:", myId, initTreshold);
                if (initTreshold >= 0){
                	console.log("dec Do dists");
                	addOne(dists, myXsize, myYsize, decIndx, decVal);

					myBlob = dists.slice(); 
					makeBlob(myBlob, myId, xSize, ySize);

					console.log("myBlob");
					if( dists.length == 1024){
						printa32(myBlob, 32)
					}
                }
				else{
					theMostSimilarThreshold++;
					console.log("dec do something else w", theMostSimilarThreshold);
					var labledr = findBlobs(gGauss, myXsize, myYsize, theMostSimilarThreshold);

					var labelAppearence = new Array(ourSelectedRegion.length);
					for(var x=0; x<ourSelectedRegion.length; x++){
						 labelAppearence[x] = labledr.data[ourSelectedRegion[x]];
					}

				 	var maxL = findBiggestBlob(labelAppearence);

				    // console.log(" maxLabel ",maxL.label);
					// if( dists.length == 1024){
					// 	printa32(labledr.data, 32)
					// }

					for(var x=0; x<labledr.data.length; x++){
						if(labledr.data[x] !== maxL.label){
							labledr.data[x] = 0;
						}
						else{
							labledr.data[x] = myId;
						}
					}
				 //    console.log(" maxLabel ",maxL.label);
					// if( dists.length == 1024){
					// 	printa32(labledr.data, 32)
					// }

					return labledr.data.slice();
				}

				return myBlob;
            },
            getBlob: function() {
                return myBlob;
            }
        };
    };
}(this));

  function findBiggestBlob(map){
    var uniqueInMap = unique(map);

    var label, max = 0, maxLabel = 99999;
    for( label in uniqueInMap ){
      if(label != 0){
        if(uniqueInMap[label] > max){
          max = uniqueInMap[label];
          maxLabel = label;
        }
      }
    }

    return {"max":max, "label":Number(maxLabel)};
  }

function printa(data, myImageH){

    var dptr = 0;
    for (var ypsilon = 0; ypsilon < myImageH; ypsilon++) {
        console.log(data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++] , data[dptr++], data[dptr++], data[dptr++], data[dptr++],"  ", ypsilon);    
    }
}

function printa32(data, myImageH){

    var dptr = 0;
    for (var ypsilon = 0; ypsilon < myImageH; ypsilon++) {
        console.log(data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++] , data[dptr++], data[dptr++], data[dptr++], data[dptr++],
        			data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++], data[dptr++] , data[dptr++], data[dptr++], data[dptr++], data[dptr++],"  ", ypsilon);    
    }
}


function makeBlob(myBlob, myId, xSize, ySize){
	var blobSize = 0;

	for(var y=1; y<ySize-1; y++){
		for(var x=1; x<xSize-1; x++){
		    var p = (y*xSize+x);

			if(myBlob[p] <= 0){
				myBlob[p] = myId;
				blobSize++;
			}
			else{
				myBlob[p] = 0;
			}
		}
	}
	console.log("blobSize" , blobSize ,"px");
}

function addOne(mydists, xSize, ySize, decIndx, decVal){
	
	var zeroIndx = decIndx.pop();
	var indxValue = decVal.pop();
	if(zeroIndx){

		for(var y=1; y<ySize-1; y++){
			for(var x=1; x<xSize-1; x++){
				var p = (y*xSize+x);

				if(mydists[p] !== 0){
					mydists[p] = mydists[p] + TSTEP;
				}
		   	}
		}
		for(var x=0; x<zeroIndx.length; x++){
			mydists[zeroIndx[x]] = indxValue[x] + TSTEP;
		}
	}
}

function subtactOne(mydists, xSize, ySize, decIndx, decVal){
	var zeroIndx = [];
	var indxValue = [];
	for(var y=1; y<ySize-1; y++){
		for(var x=1; x<xSize-1; x++){
			var p = (y*xSize+x);

			if(mydists[p] !== 0){
				mydists[p] = mydists[p] - TSTEP;
				if(mydists[p] <= 0){
					zeroIndx.push(p);
					indxValue.push(mydists[p]); //>= 0 ? mydists[p] : -mydists[p]
				}
			}
	   	}
	}
	decIndx.push(zeroIndx);
	decVal.push(indxValue);
}

function getDistances(src, distances, xSize, ySize){
	var conArea = unique(distances)[0] - ((xSize * 2) + (ySize * 2) - 4);
	var cnt = 0;
	var itterImage = 0;
	do {
		for(var y=1; y<ySize-1; y++){
			for(var x=1; x<xSize-1; x++){
			    var p = (y*xSize+x);

			    if(distances[p] === 0){
			    	
					var q = [((y-1)*xSize+x), ((y+1)*xSize+x),(y*xSize+(x-1)), (y*xSize+(x+1))];

					if(distances[q[0]] === -1 || distances[q[1]] === -1 || distances[q[2]] === -1 || distances[q[3]] === -1 ){
						cnt ++;
						var zNeighbors = [];
						for(var i=0; i<q.length; i++){
							if(distances[q[i]] === -1){
								zNeighbors.push(src[q[i]]);
								var d = new Vector(1, src[q[i]] - src[p]);
								distances[p] = d.length();
							}
						}
						//Choose the min z value 
						if(zNeighbors.length > 1){
							var minz = _.min(zNeighbors);
							var d = new Vector(1, src[p] - minz);
							distances[p] = d.length();
						}
					}
					else if(distances[q[0]] !== 0 || distances[q[1]] !== 0 || distances[q[2]] !== 0 || distances[q[3]] !== 0){
						cnt ++;
						var zNeighbors = [];
						var vNeighbors = [];
						for(var i=0; i<q.length; i++){
							if(distances[q[i]] !== -1 && distances[q[i]] !== 0){
								zNeighbors.push(src[q[i]]);
								vNeighbors.push(distances[q[i]]);
							}
						}
						//Choose the min v value and that corresponding z value 
						var minv = _.min(vNeighbors);
						var d = new Vector(1, src[p] - zNeighbors[_.indexOf(vNeighbors, minv)]);
						distances[p] = d.length() + minv;
					}
		    	}		      
			}
		}
		itterImage++;
		if(cnt >= conArea) break;
	} while(true);

	console.log("itterImage", itterImage);
}

function getDistanceswQue(src, distances, xSize, ySize, indexDone, genImageData){

    // set up priority queue
    var priorityQueue = new UntidyPriorityQueue(20, 2);

	var conArea = unique(distances)[0] - ((xSize * 2) + (ySize * 2) - 4);
	var cnt = 0, itcnt = 0;
	for(var y=1; y<ySize-1; y++){
		for(var x=1; x<xSize-1; x++){
		    var p = (y*xSize+x);

	        if(genImageData[((p) *4)+3] == 0){
	        	distances[p] = 999;
	        	indexDone[p] = 1;
	        }

		    else if(distances[p] === 0){
		    	
				var q = [((y-1)*xSize+x), ((y+1)*xSize+x),(y*xSize+(x-1)), (y*xSize+(x+1))];

				if(distances[q[0]] === -1 || distances[q[1]] === -1 || distances[q[2]] === -1 || distances[q[3]] === -1 ){
					cnt ++;
					var zNeighbors = [];
					for(var i=0; i<q.length; i++){
						if(distances[q[i]] === -1){
							zNeighbors.push(src[q[i]]);
							var d = new Vector(1, src[q[i]] - src[p]);
							distances[p] = d.length();
						}
					}
					//Choose the min z value 
					if(zNeighbors.length > 1){
						var minz = _.min(zNeighbors);
						var d = new Vector(1, src[p] - minz);
						distances[p] = d.length();
					}
					indexDone[p] = 1;
					if(distances[q[0]] === 0)
						priorityQueue.push(q[0], 0);
					if(distances[q[1]] === 0)
						priorityQueue.push(q[1], 0);
					if(distances[q[2]] === 0)
						priorityQueue.push(q[2], 0);
					if(distances[q[3]] === 0)
						priorityQueue.push(q[3], 0);
				}
	    	}		      
		}
	}

	function addDistance(index, r, c){
        if (r >= (ySize - 1) || r < 1 || c >= (xSize - 1) || c < 1) {
        	return;
        }

    	if (indexDone[index] === 1 ) {
    		return;
        }
        // if(genImageData[((index) *4)+3] == 0){
        // 	distances[index] = 999;
        // 	return;

        // }
       	else{
       		var q = [((r-1)*xSize+c), ((r+1)*xSize+c),(r*xSize+(c-1)), (r*xSize+(c+1))];
       		var zNeighbors = [];
			var vNeighbors = [];
			for(var i=0; i<q.length; i++){
				if(distances[q[i]] !== -1 && distances[q[i]] !== 0){
					zNeighbors.push(src[q[i]]);
					vNeighbors.push(distances[q[i]]);
				}
			}
			//Choose the min v value and that corresponding z value 
			var minv = _.min(vNeighbors);
			var d = new Vector(1, src[index] - zNeighbors[_.indexOf(vNeighbors, minv)]);
			distances[index] = d.length() + minv;

			if(distances[q[0]] === 0)
				priorityQueue.push(q[0], 0);
			if(distances[q[1]] === 0)
				priorityQueue.push(q[1], 0);
			if(distances[q[2]] === 0)
				priorityQueue.push(q[2], 0);
			if(distances[q[3]] === 0)
				priorityQueue.push(q[3], 0);
       	}
	}

	//räkna resten
    while (!priorityQueue.empty()) {
	    var curPixel = priorityQueue.pop();

        var r = Math.floor(curPixel / xSize);
        var c = curPixel % xSize;

	    addDistance(curPixel, r, c);
	    indexDone[curPixel] = 1;
    }
}


function getGradients(src, gradients, xSize, ySize){

	for(var y=1; y<ySize-1; y++) {
		for(var x=1; x<xSize-1; x++){

			var p = (y*xSize+x);
			var q = [((y-1)*xSize+x), ((y+1)*xSize+x),(y*xSize+(x-1)), (y*xSize+(x+1))];
			var gradient = 4 * src[p] - src[(y-1)*xSize+x] - src[(y+1)*xSize+x] - src[y*xSize+(x-1)] - src[y*xSize+(x+1)];
			gradients[p] = gradient >= 0 ? gradient : -gradient;		

		}
	}
};

function unique(arr){

    var value, counts = {};
    var i, l = arr.length;
    for( i=0; i<l; i+=1) {
        value = arr[i];
        if( counts[value] ){
            counts[value] += 1;
        }else{
            counts[value] = 1;
        }
    }

    return counts;
};
