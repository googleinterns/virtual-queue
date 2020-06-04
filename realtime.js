(function(){

  //Firebase Configuration
  var firebaseConfig = {
    apiKey: "AIzaSyB3-o9IM6IrUJvN7bkdXQocXaW3WkNEsIk",
    authDomain: "virtualqueue-d9143.firebaseapp.com",
    databaseURL: "https://virtualqueue-d9143.firebaseio.com",
    projectId: "virtualqueue-d9143",
    storageBucket: "virtualqueue-d9143.appspot.com",
    messagingSenderId: "7431741731",
    appId: "1:7431741731:web:3e07995aa33225882c6c96",
    measurementId: "G-YF3PEMTFKC"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  //firebase.analytics();

  var userId = null;
  //newQueueRef stores the the reference to the new queue element
  var newQueueRef = null;
  var queuePosition = document.getElementById('queue-position');

  const dbRefQueue = firebase.database().ref().child('Queue');

  //Adding user to the queue
  document.getElementById('queue-join').addEventListener("click", function(){
    userId = document.querySelector('#uId').value;
    newQueueRef = dbRefQueue.push();
    newQueueRef.set({
        userId : userId
    });
  });

  //Removing user from the queue
  document.getElementById('queue-exit').addEventListener("click", function(){
    newQueueRef.remove();
  });

  //Listening for changes to the queue
  //Updates the number of people ahead of the user in the queue by iterating throught the queue
  dbRefQueue.on('value', function(snap){
    let count = 0;
    snap.forEach(function(childSnap){
      if(userId==childSnap.val().userId){
        return true;
      }
      count++;
    });
    queuePosition.innerText = count;
    //Alert the user when his position is 1
    if(count==1){
      alert("Your token is approaching!!");
    }
  });

}());
  
