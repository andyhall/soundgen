
/*!
 * wasgen: a web audio sound generator
 * @url      github.com/andyhall/wasgen
 * @author   Andy Hall <andy@fenomas.com>
 * @license  ISC
 */


import SoundPlayer from './soundPlayer'
import { initializeWorklet } from './builders/crusher'
import { version } from '../package.json'



/*
 *
 *      WASGEN
 *  
 *      Root module just exposes the API and conforms inputs
 * 
*/

export default function Generator(audioContext, destination, noCompressor, silent) {
    var self = this
    self.version = version
    if (!silent) console.log(`wasgen     v${self.version}`)


    /*
     * 
     *      init settings and output chain
     * 
    */

    var ctx = audioContext ||
        new (window.AudioContext || window.webkitAudioContext)()
    var player = new SoundPlayer(ctx)

    var checkContext = () => {
        if (ctx.startRendering) return // skip for offline contexts
        if (ctx.state !== 'running') ctx.resume()
        initializeWorklet(ctx)
    }

    var currDest = destination || ctx.destination


    // when given offline context, init immediately
    if (ctx.startRendering) initializeWorklet(ctx)







    /*
     * 
     *      Audio API
     * 
    */

    var soon = () => ctx.currentTime + 0.05

    this.play = function (program, freq, vel, time, releaseTime, destNode) {
        checkContext()
        freq = freq || 440
        vel = vel || 1
        time = time || soon()
        releaseTime = releaseTime || 0
        destNode = destNode || compressor || currDest
        var noteID = player.play(program, freq, vel, time, releaseTime, destNode)
        return noteID
    }

    this.bend = function (noteID, freq, timeConst, time) {
        freq = freq || 440
        timeConst = timeConst || 0.1
        time = time || soon()
        player.bend(noteID, freq, timeConst, time)
    }

    this.release = function (noteID, time) {
        time = time || soon()
        player.release(noteID, time)
    }

    this.noteIsPlaying = function (noteID) {
        return player.isPlaying(noteID)
    }

    this.releaseAll = function (time) {
        time = time || soon()
        player.releaseAll(time)
    }




    /*
     * 
     *      getter/setters
     * 
    */

    this.compressor = null

    this.now = function () {
        return ctx.currentTime
    }

    this.maxVoices = function (n) {
        if (n) player.maxVoices = n
        return player.maxVoices
    }

    this.destination = function (dest) {
        if (dest) {
            currDest = dest
            initCompressor()
        }
        return currDest
    }

    this.audioContext = function (context) {
        if (context) {
            this.dispose()
            ctx = context
            player = new SoundPlayer(ctx)
            currDest = ctx.destination
            initCompressor()
        }
        return ctx
    }





    /*
     * 
     *      compressor in output chain, by default
     * 
    */

    function initCompressor() {
        if (compressor) compressor.disconnect()
        if (noCompressor) return
        compressor = ctx.createDynamicsCompressor()
        compressor.threshold.value = -24    // -24
        compressor.knee.value = 25          // 30
        compressor.ratio.value = 20         // 12
        compressor.attack.value = 0.003     // 0.003
        compressor.release.value = 0.25     // 0.25
        compressor.connect(currDest)
        self.compressor = compressor
    }

    var compressor = null
    initCompressor()







    /*
     * 
     *      lifecycle
     * 
    */

    this.dispose = function () {
        player.dispose()
        player = null
        if (compressor) compressor.disconnect()
        compressor = null
        currDest = null
        ctx = null
    }



}



