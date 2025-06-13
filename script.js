
        // Import Firebase modules
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
        import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

        // Your Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDvUugAe1l3T4xD-kSKC1eSWpFC2FCWvuE",
            authDomain: "omm-mark.firebaseapp.com",
            projectId: "omm-mark",
            storageBucket: "omm-mark.firebasestorage.app",
            messagingSenderId: "500470223125",
            appId: "1:500470223125:web:a4ff0c1cc10ee27e46591c",
            measurementId: "G-4C6RRMF2J5"
        };

        // Global variables
        let db = null;
        let marksData = [];
        let isFirebaseConnected = false;

        // Make functions globally available
        window.addMarks = addMarks;
        window.switchTab = switchTab;
        window.filterMarks = filterMarks;
        window.showChapterAnalysis = showChapterAnalysis;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', async function() {
            // Set default date to today
            document.getElementById('test-date').value = new Date().toISOString().split('T')[0];
            
            // Auto-connect to Firebase
            await connectFirebase();
        });

        // Connect to Firebase
        async function connectFirebase() {
            try {
                updateConnectionStatus('🔄 Connecting to Firebase...', 'status-disconnected');

                // Initialize Firebase
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);

                // Test connection by trying to read data
                await loadMarksData();
                
                isFirebaseConnected = true;
                updateConnectionStatus('✅ Connected to Firebase - Real-time sync active', 'status-connected');
                
                // Initialize real-time listener
                setupRealtimeListener();
                
                showSuccessMessage('Firebase connected successfully!');

            } catch (error) {
                console.error('Firebase connection error:', error);
                showErrorMessage('Firebase connection failed: ' + error.message);
                updateConnectionStatus('❌ Firebase connection failed', 'status-disconnected');
            }
        }

        // Setup real-time listener for marks collection
        function setupRealtimeListener() {
            const marksRef = collection(db, 'marks');
            const q = query(marksRef, orderBy('timestamp', 'desc'));
            
            onSnapshot(q, (snapshot) => {
                marksData = [];
                snapshot.forEach((doc) => {
                    marksData.push({ id: doc.id, ...doc.data() });
                });
                updateAllViews();
            }, (error) => {
                console.error('Real-time listener error:', error);
                showErrorMessage('Real-time sync error: ' + error.message);
            });
        }

        // Load marks data from Firestore
        async function loadMarksData() {
            if (!db) return;
            
            try {
                const marksRef = collection(db, 'marks');
                const q = query(marksRef, orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(q);
                
                marksData = [];
                querySnapshot.forEach((doc) => {
                    marksData.push({ id: doc.id, ...doc.data() });
                });
                
                updateAllViews();
            } catch (error) {
                console.error('Error loading marks data:', error);
                showErrorMessage('Error loading data: ' + error.message);
            }
        }

        // Add marks to Firestore
        async function addMarks() {
            if (!isFirebaseConnected) {
                showErrorMessage('Please wait for Firebase connection');
                return;
            }

            const date = document.getElementById('test-date').value;
            const subject = document.getElementById('subject').value.trim();
            const chapter = document.getElementById('chapter').value.trim();
            const marksObtained = parseInt(document.getElementById('marks-obtained').value);
            const totalMarks = parseInt(document.getElementById('total-marks').value);
            const testType = document.getElementById('test-type').value;

            // Validation
            if (!date || !subject || !chapter || isNaN(marksObtained) || isNaN(totalMarks) || !testType) {
                showErrorMessage('Please fill all fields correctly');
                return;
            }

            if (marksObtained > totalMarks) {
                showErrorMessage('Marks obtained cannot be greater than total marks');
                return;
            }

            // Disable button during submission
            const addButton = document.getElementById('add-marks-btn');
            addButton.disabled = true;
            addButton.textContent = 'Adding...';

            try {
                // Calculate percentage
                const percentage = ((marksObtained / totalMarks) * 100);

                // Create marks entry
                const marksEntry = {
                    date: date,
                    subject: subject,
                    chapter: chapter,
                    marksObtained: marksObtained,
                    totalMarks: totalMarks,
                    percentage: parseFloat(percentage.toFixed(2)),
                    testType: testType,
                    timestamp: new Date()
                };

                // Add to Firestore
                await addDoc(collection(db, 'marks'), marksEntry);

                // Clear form
                document.getElementById('test-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('subject').value = '';
                document.getElementById('chapter').value = '';
                document.getElementById('marks-obtained').value = '';
                document.getElementById('total-marks').value = '';
                document.getElementById('test-type').value = '';

                showSuccessMessage('Marks added successfully and synced to cloud!');

            } catch (error) {
                console.error('Error adding marks:', error);
                showErrorMessage('Error adding marks: ' + error.message);
            } finally {
                // Re-enable button
                addButton.disabled = false;
                addButton.textContent = 'ADD MARKS';
            }
        }

        // Update connection status
        function updateConnectionStatus(message, className) {
            const statusEl = document.getElementById('connection-status');
            statusEl.textContent = message;
            statusEl.className = 'connection-status ' + className;
        }

        // Show success message
        function showSuccessMessage(message) {
            const successEl = document.getElementById('success-message');
            successEl.textContent = '✅ ' + message;
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 5000);
        }

        // Show error message
        function showErrorMessage(message) {
            const errorEl = document.getElementById('error-message');
            errorEl.textContent = '❌ ' + message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 8000);
        }

        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
            
            // Load data for specific tabs
            if (tabName === 'view') {
                showAllMarks();
            } else if (tabName === 'chapter') {
                updateChapterFilters();
            } else if (tabName === 'stats') {
                showStatistics();
            }
        }

        // Update all views and filters
        function updateAllViews() {
            updateFilters();
            showAllMarks();
            updateChapterFilters();
            showStatistics();
        }

        // Update filter dropdowns
        function updateFilters() {
            const subjects = [...new Set(marksData.map(entry => entry.subject))];
            const chapters = [...new Set(marksData.map(entry => entry.chapter))];
            const testTypes = [...new Set(marksData.map(entry => entry.testType))];

            updateSelectOptions('filter-subject', subjects);
            updateSelectOptions('filter-chapter', chapters);
            updateSelectOptions('filter-type', testTypes);
            updateSelectOptions('chapter-subject', subjects);
        }

        // Helper function to update select options
        function updateSelectOptions(selectId, options) {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            
            // Clear existing options except the first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add new options
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            
            // Restore previous selection if it still exists
            if (options.includes(currentValue)) {
                select.value = currentValue;
            }
        }

        // Show all marks with filtering
        function showAllMarks() {
            const container = document.getElementById('marks-table-container');
            
            if (!isFirebaseConnected) {
                container.innerHTML = '<div class="no-data">🔄 Please wait for Firebase connection</div>';
                return;
            }

            if (marksData.length === 0) {
                container.innerHTML = '<div class="no-data">📝 No marks recorded yet. Add some test results to get started!</div>';
                return;
            }

            // Get filter values
            const subjectFilter = document.getElementById('filter-subject').value;
            const chapterFilter = document.getElementById('filter-chapter').value;
            const typeFilter = document.getElementById('filter-type').value;

            // Filter data
            let filteredData = marksData.filter(entry => {
                return (!subjectFilter || entry.subject === subjectFilter) &&
                       (!chapterFilter || entry.chapter === chapterFilter) &&
                       (!typeFilter || entry.testType === typeFilter);
            });

            // Sort by date (newest first)
            filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Create table
            let tableHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Chapter</th>
                            <th>Test Type</th>
                            <th>Score</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            filteredData.forEach(entry => {
                const scoreClass = getScoreClass(entry.percentage);
                tableHTML += `
                    <tr>
                        <td>${formatDate(entry.date)}</td>
                        <td><strong>${entry.subject}</strong></td>
                        <td>${entry.chapter}</td>
                        <td>${entry.testType}</td>
                        <td>${entry.marksObtained}/${entry.totalMarks}</td>
                        <td><span class="score-badge ${scoreClass}">${entry.percentage}%</span></td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';

            if (filteredData.length === 0) {
                container.innerHTML = '<div class="no-data">🔍 No marks match the selected filters</div>';
            } else {
                container.innerHTML = tableHTML;
            }
        }

        // Filter marks function
        function filterMarks() {
            showAllMarks();
        }

        // Get score class based on percentage
        function getScoreClass(percentage) {
            if (percentage >= 90) return 'score-excellent';
            if (percentage >= 75) return 'score-good';
            if (percentage >= 60) return 'score-average';
            return 'score-poor';
        }

        // Format date for display
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        // Update chapter filters
        function updateChapterFilters() {
            const subjects = [...new Set(marksData.map(entry => entry.subject))];
            updateSelectOptions('chapter-subject', subjects);
            showChapterAnalysis();
        }

        // Show chapter-wise analysis
        function showChapterAnalysis() {
            const container = document.getElementById('chapter-analysis-container');
            const selectedSubject = document.getElementById('chapter-subject').value;
            
            if (!isFirebaseConnected) {
                container.innerHTML = '<div class="no-data">🔄 Please wait for Firebase connection</div>';
                return;
            }

            if (!selectedSubject) {
                container.innerHTML = '<div class="no-data">📊 Select a subject to view chapter-wise analysis</div>';
                return;
            }

            // Filter data by subject
            const subjectData = marksData.filter(entry => entry.subject === selectedSubject);
            
            if (subjectData.length === 0) {
                container.innerHTML = '<div class="no-data">📝 No data available for this subject</div>';
                return;
            }

            // Group by chapter and calculate averages
            const chapterStats = {};
            subjectData.forEach(entry => {
                if (!chapterStats[entry.chapter]) {
                    chapterStats[entry.chapter] = {
                        totalPercentage: 0,
                        count: 0,
                        scores: [],
                        testTypes: []
                    };
                }
                chapterStats[entry.chapter].totalPercentage += entry.percentage;
                chapterStats[entry.chapter].count++;
                chapterStats[entry.chapter].scores.push(entry.percentage);
                chapterStats[entry.chapter].testTypes.push(entry.testType);
            });

            // Create chapter analysis table
            let analysisHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Chapter</th>
                            <th>Tests Taken</th>
                            <th>Average Score</th>
                    <th>Best Score</th>
                    <th>Worst Score</th>
                    <th>Performance</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.keys(chapterStats).forEach(chapter => {
        const stats = chapterStats[chapter];
        const average = (stats.totalPercentage / stats.count).toFixed(2);
        const best = Math.max(...stats.scores).toFixed(2);
        const worst = Math.min(...stats.scores).toFixed(2);
        const scoreClass = getScoreClass(average);

        analysisHTML += `
            <tr>
                <td><strong>${chapter}</strong></td>
                <td>${stats.count}</td>
                <td><span class="score-badge ${scoreClass}">${average}%</span></td>
                <td><span class="score-badge ${getScoreClass(best)}">${best}%</span></td>
                <td><span class="score-badge ${getScoreClass(worst)}">${worst}%</span></td>
                <td>${getPerformanceText(average)}</td>
            </tr>
        `;
    });

    analysisHTML += '</tbody></table>';
    container.innerHTML = analysisHTML;
}

// Get performance text based on average
function getPerformanceText(average) {
    if (average >= 90) return '🔥 Excellent';
    if (average >= 75) return '👍 Good';
    if (average >= 60) return '👌 Average';
    return '📈 Needs Improvement';
}

// Show statistics
function showStatistics() {
    const container = document.getElementById('stats-container');
    
    if (!isFirebaseConnected) {
        container.innerHTML = '<div class="no-data">🔄 Please connect to Firebase to view statistics</div>';
        return;
    }

    if (marksData.length === 0) {
        container.innerHTML = '<div class="no-data">📊 No data available for statistics</div>';
        return;
    }

    // Calculate overall statistics
    const totalTests = marksData.length;
    const totalPercentage = marksData.reduce((sum, entry) => sum + entry.percentage, 0);
    const overallAverage = (totalPercentage / totalTests).toFixed(2);
    const bestScore = Math.max(...marksData.map(entry => entry.percentage)).toFixed(2);
    const worstScore = Math.min(...marksData.map(entry => entry.percentage)).toFixed(2);
    const uniqueSubjects = [...new Set(marksData.map(entry => entry.subject))].length;
    const uniqueChapters = [...new Set(marksData.map(entry => entry.chapter))].length;

    // // Calculate grade distribution
    // const gradeDistribution = {
    //     excellent: marksData.filter(entry => entry.percentage >= 90).length,
    //     good: marksData.filter(entry => entry.percentage >= 75 && entry.percentage < 90).length,
    //     average: marksData.filter(entry => entry.percentage >= 60 && entry.percentage < 75).length,
    //     poor: marksData.filter(entry => entry.percentage < 60).length
    // };

    // Subject-wise performance
    const subjectStats = {};
    marksData.forEach(entry => {
        if (!subjectStats[entry.subject]) {
            subjectStats[entry.subject] = {
                totalPercentage: 0,
                count: 0
            };
        }
        subjectStats[entry.subject].totalPercentage += entry.percentage;
        subjectStats[entry.subject].count++;
    });

    // Create statistics HTML
    let statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${totalTests}</h3>
                <p>Total Tests</p>
            </div>
            <div class="stat-card">
                <h3>${overallAverage}%</h3>
                <p>Overall Average</p>
            </div>
            <div class="stat-card">
                <h3>${bestScore}%</h3>
                <p>Best Score</p>
            </div>
            <div class="stat-card">
                <h3>${uniqueSubjects}</h3>
                <p>Subjects Covered</p>
            </div>
            <div class="stat-card">
                <h3>${uniqueChapters}</h3>
                <p>Chapters Studied</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
            // <div class="form-section">
            //     <h3>📊 Grade Distribution</h3>
            //     <table class="data-table">
            //         <thead>
            //             <tr>
            //                 <th>Grade Range</th>
            //                 <th>Count</th>
            //                 <th>Percentage</th>
            //             </tr>
            //         </thead>
            //         <tbody>
            //             <tr>
            //                 <td>Excellent (90-100%)</td>
            //                 <td>${gradeDistribution.excellent}</td>
            //                 <td>${((gradeDistribution.excellent / totalTests) * 100).toFixed(1)}%</td>
            //             </tr>
            //             <tr>
            //                 <td>Good (75-89%)</td>
            //                 <td>${gradeDistribution.good}</td>
            //                 <td>${((gradeDistribution.good / totalTests) * 100).toFixed(1)}%</td>
            //             </tr>
            //             <tr>
            //                 <td>Average (60-74%)</td>
            //                 <td>${gradeDistribution.average}</td>
            //                 <td>${((gradeDistribution.average / totalTests) * 100).toFixed(1)}%</td>
            //             </tr>
            //             <tr>
            //                 <td>Needs Improvement (<60%)</td>
            //                 <td>${gradeDistribution.poor}</td>
            //                 <td>${((gradeDistribution.poor / totalTests) * 100).toFixed(1)}%</td>
            //             </tr>
            //         </tbody>
            //     </table>
            // </div>

            <div class="form-section">
                <h3>📚 Subject-wise Performance</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Tests</th>
                            <th>Average</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    Object.keys(subjectStats).forEach(subject => {
        const stats = subjectStats[subject];
        const average = (stats.totalPercentage / stats.count).toFixed(2);
        const scoreClass = getScoreClass(average);
        
        statsHTML += `
            <tr>
                <td><strong>${subject}</strong></td>
                <td>${stats.count}</td>
                <td><span class="score-badge ${scoreClass}">${average}%</span></td>
            </tr>
        `;
    });

    statsHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = statsHTML;
}
