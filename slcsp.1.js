const fs = require('fs')
//This file contains an alternate solution to the SLCSP homework. Instead of using the approach in the previous file, slcsp.js, which required numerous nested loops, this file accomplishes the same result in practically O(n) time. The downside here is the creation of multiple cache objects that increase space complexity. In the spirit of keeping things simpler, as hinted to in the prompts, this code was not put into separate files and imported, although the modularity of the functions below hopefully would allow for that. 

const plansFile = fs.readFileSync('plans.csv', 'utf8')
const zipsFile = fs.readFileSync('zips.csv', 'utf8') //consistent quotes
const slcspFile = fs.readFileSync('slcsp.1.csv', 'utf8')

// This function creates an array from the slcsp csv that was passed in.
let createSlcspArr = file => {
  let slcspArr = file.split('\n')
  return slcspArr
}
// This function creates a cache from the array, which allows for instant lookup, insertion, and deletion times.
let createSlcspCache = arr => {
  let slcspCache = {}
  for (let i = 1; i < arr.length; i++) {
    arr[i] = arr[i].replace(',', '')
    slcspCache[arr[i]] = null
  }
  return slcspCache
}
//Instead of splitting, slicing, and joining back and forth as done in the other file, the cleanliness and ease of checking against an object at a key, particularly when considering the instant time of said checks, is the route I took here as preferred. What this function does is loop through the zip codes and invalidate the cached slcsp zips that have more than one rate area. 
let createZipSlcspCache = (cache, zipFile) => {
  let zipArr = zipFile.split('\n')
  for (let i = 1; i < zipArr.length; i++) {
    let zipLine = zipArr[i].split(','),
      zipCode = zipLine[0],
      rateArea = zipLine[1] + zipLine[zipLine.length - 1];
    if (cache[zipCode] === null) {
      cache[zipCode] = rateArea
    } else if (cache[zipCode] && cache[zipCode] !== null && cache[zipCode] !== rateArea) {
      cache[zipCode] = 'invalid'
    }
  }
  return cache
}
//This function creates a cache for the plans file, and then determines whether the value at a rate area key has a rate value from a silver plan. If it does not, an array is set there with that first value, and if it does, the other values are pushed in. This cache immediately cleans up the amount of data we have to deal with subsequently. 
let createPlansCache = (file) => {
  let plansCache = {},
    plansArr = file.split('\n');
  for (let i = 1; i < plansArr.length; i++) {
    let planLine = plansArr[i].split(','),
      rateArea = planLine[1] + planLine[planLine.length - 1],
      metalLevel = planLine[2],
      rate = planLine[3];
    if (metalLevel === 'Silver') plansCache[rateArea] ? plansCache[rateArea].push(rate) : plansCache[rateArea] = [rate]
  }
  return plansCache
}
//Once again, this function takes care of duplicate entries to ensure that we do not return a duplicate value as the second lowest. 
let removeDuplicates = (arr) => {
  arr = arr.sort((a, b) => a - b)
  for (let i = arr.length - 2; i >= 0; i--) {
    if (arr[i] === arr[i + 1]) {
      arr.splice(i, 1)
    }
  }
  return arr
}
//This function takes the slcsp cache and the plans cache, and replaces those zip codes which have a valid SLCSP with the correct rate. The others are made blank.
let solveSlcsp = (cachedSlcsp, cachedPlans) => {
  Object.keys(cachedSlcsp).forEach(zipCode => {
    let slcspValue = cachedSlcsp[zipCode]
    if (cachedPlans[slcspValue] && cachedPlans[slcspValue] !== null && cachedPlans[slcspValue] !== 'invalid') {
      cachedSlcsp[zipCode] = removeDuplicates(cachedPlans[slcspValue]).slice(1, 2)[0]
    } else {
      cachedSlcsp[zipCode] = ''
    }
  })
  return cachedSlcsp
}
//This function accepts the JS Slcsp array and the cache with the answers to the prompt. This function uses the instant lookup time of the cache and the linear time loop through the slcspArray to reduce the amount of time it takes to complete this operation and perhaps offer a more optimized solution than the other file. Also, because Object key order is technically not guaranteed, using the original array that was created allows us to both reuse the array instead of creating another and recreate the SLCSP file in the exact same order in which it was originally found, as per the specs. 
let writeSlcspCsv = (slcspArray, solvedSlcspCache, outputFile) => {
  let csvString = slcspArray[0] + '\n'
  for (let i = 1; i < slcspArray.length; i++) {
    let slcspElem = slcspArray[i]
    csvString += slcspElem + ',' + solvedSlcspCache[slcspElem] + '\n'
  }
  fs.writeFileSync(outputFile, csvString, 'utf8')
}
//This function sets up the entire process. First, the array of slcsps is created,
//after which it is cached. Then, the zip and slcsp data is used to create the initial cache with some values checked for multiple rate areas. The plan cache is then created, and the solution is arrived at by then running the comparison with the plan file. The solution is then rewritten into the slcsp.1.csv.
let findResultsSlcsp = (inputSlcsp, zipFile, inputPlans) => {
  let slcspArr = createSlcspArr(inputSlcsp),
    slcspCache = createSlcspCache(slcspArr),
    createdZipSlcspCache = createZipSlcspCache(slcspCache, zipFile),
    createdPlanCache = createPlansCache(inputPlans);

  let solutionSlcsp = solveSlcsp(createdZipSlcspCache, createdPlanCache)
  writeSlcspCsv(slcspArr, solutionSlcsp, 'slcsp.1.csv')
}
//invoke the solving function with the slcspFile, the zipcode file, and the plans file.
findResultsSlcsp(slcspFile, zipsFile, plansFile)
