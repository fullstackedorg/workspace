export default function () {
    return <>
        <style>{`
            @keyframes bounce {
              0% {transform: translateY(0)}
              66% {transform: translateY(5px)}
              100% {transform: translateY(0)}
            }
            #top {
              animation-name: bounce;
              animation-duration: 4s;
              animation-iteration-count: infinite;
            }
            
            @keyframes bounce2 {
              0% {transform: translateY(0)}
              50% {transform: translateY(-5px)}
              100% {transform: translateY(0)}
            }
            #bottom {
              animation-name: bounce2;
              animation-duration: 4s;
              animation-iteration-count: infinite;
            }

        `}</style>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81.75781 85.78106">
            <path id={"bottom"} fill="#0b85b5" d="M36.44429,84.40073,1.57249,61.01531a3.97092,3.97092,0,0,1,0-6.32953L37.5461,30.56147a5.87239,5.87239,0,0,1,6.66562,0l35.9736,24.12431a3.97091,3.97091,0,0,1,0,6.32953L45.31352,84.40073A7.81372,7.81372,0,0,1,36.44429,84.40073Z" />
            <path fill="#00b0df" d="M36.44429,69.39265,1.57249,46.00723a3.97092,3.97092,0,0,1,0-6.32953L37.5461,15.55339a5.87239,5.87239,0,0,1,6.66562,0L80.18532,39.6777a3.97091,3.97091,0,0,1,0,6.32953L45.31352,69.39265A7.81376,7.81376,0,0,1,36.44429,69.39265Z" />
            <path id={"top"} fill="#80d7ef" d="M36.44429,54.87664,1.57249,31.49121a3.97091,3.97091,0,0,1,0-6.32952L37.5461,1.03738a5.87239,5.87239,0,0,1,6.66562,0l35.9736,24.12431a3.9709,3.9709,0,0,1,0,6.32952L45.31352,54.87664A7.81376,7.81376,0,0,1,36.44429,54.87664Z" />
    </svg>
    </>
}
