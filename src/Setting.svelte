<script>
    import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
    import "../node_modules/@fortawesome/fontawesome-free/js/all.min.js";
    import { showSetting, darkmode } from "./stores.js";
    let show = true;
    let darkmodeVal;

    const unsubscribe = showSetting.subscribe(showSettingRes => {
      show = showSettingRes;
    });

    const unsubdarkmode = darkmode.subscribe(oldDarkmode => {
      darkmodeVal = oldDarkmode;
    });


    const handleDarkmode = e => {
      let isChecked = e.target.checked;
      darkmode.update(oldDarkmode => isChecked);
    }

</script>


<div class="setting-panel">
    {#if show}
      <div class="list">
      <div class="item close-icon" on:click={ () =>{showSetting.update(showSetting => false);}}>
        <i class="far fa-times-circle right"></i>
      </div>
      <div class="item">
          <p>Dark mode</p>
          <label class="switch">
              <input type="checkbox" id="checkboxID" on:change={handleDarkmode} bind:checked={darkmodeVal}>
              <span class="slider round"></span>
          </label>
      </div>
      <div class="item">
          <p>Setting item here</p>
      </div>
      </div>
    {/if}
    <div class="setting-icon" on:click={ () =>{showSetting.update(showSetting => !showSetting);}}>
    <i class="fas fa-sliders-h fa-2x right" ></i>
    </div>
</div>



<style>
    .setting-panel {
        position: absolute;
        /* float: right; */
        bottom : 20px;
        right : 50px;
    }
    .right {
        float: right;
    }
    .item {
        display: flex;
        padding: 0px 10px;
        cursor: pointer;
        width:100%;
    }
    
    .item p {
      margin-right: 10px;
   
    }

    .list{
        border: 0.5px solid darkgrey;
        margin-bottom: 20px;
        padding: 5px 10px;
        box-shadow: aquamarine;
        box-shadow: 3px 4px 6px 0px black;
        border-radius: 5px; 
        -webkit-animation: popup 0.2s ;
        -moz-animation: popup 0.2s ;
        -o-animation: popup 0.2s ;
        animation: popup 0.2s ;
    }


    @keyframes popup {
        0% {
            transform: translatex(50px) translatey(50px) scale(0.2)
        }
        100% {
            transform: translatex(0px) translatey(0px) scale(1);
        }
    }


/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 20px;
  /* margin-left: 10px */
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 13px;
  width: 13px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(13px);
  -ms-transform: translateX(13px);
  transform: translateX(13px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
.close-icon {
  position: relative;
  margin-left:80%;  
}
</style>
